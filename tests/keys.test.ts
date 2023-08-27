import { ECIES_CONFIG, PrivateKey, PublicKey, utils } from "../src/index";

const decodeHex = utils.decodeHex;

const two = new Uint8Array(32);
two[31] = 2;
const three = new Uint8Array(32);
three[31] = 3;

describe("test keys", () => {
  function checkHkdf(k1: PrivateKey, k2: PrivateKey, knownHex: string) {
    const derived1 = k1.encapsulate(k2.publicKey);
    const derived2 = k1.publicKey.decapsulate(k2);
    const known = decodeHex(knownHex);
    expect(derived1).toEqual(known);
    expect(derived2).toEqual(known);
  }

  it("tests invalid", () => {
    // 0 < private key < group order int
    const ERROR = "Invalid private key";
    const groupOrderInt =
      "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141";
    expect(() => PrivateKey.fromHex(groupOrderInt)).toThrow(ERROR);

    const groupOrderIntAdd1 =
      "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364142";

    expect(() => PrivateKey.fromHex(groupOrderIntAdd1)).toThrow(ERROR);
    expect(() => PrivateKey.fromHex("00")).toThrow(ERROR);
  });

  it("tests equal", () => {
    const sk = new PrivateKey();
    const pk = PublicKey.fromHex(sk.publicKey.toHex(false));

    expect(pk.equals(sk.publicKey)).toBe(true);

    const isFromHexWorking = sk.equals(PrivateKey.fromHex(sk.toHex()));
    expect(isFromHexWorking).toBe(true);
  });

  it("tests eth key compatibility", () => {
    const ethPrv = PrivateKey.fromHex(
      "0x95d3c5e483e9b1d4f5fc8e79b2deaf51362980de62dbb082a9a4257eef653d7d"
    );
    const ethPub = PublicKey.fromHex(
      "0x98afe4f150642cd05cc9d2fa36458ce0a58567daeaf5fde7333ba9b403011140" +
        "a4e28911fcf83ab1f457a30b4959efc4b9306f514a4c3711a16a80e3b47eb58b"
    );
    expect(ethPub).toEqual(ethPrv.publicKey);
    expect(ethPub.toHex(true)).toEqual(
      "0398afe4f150642cd05cc9d2fa36458ce0a58567daeaf5fde7333ba9b403011140"
    );
    expect(ethPub.toHex(false)).toEqual(
      "0498afe4f150642cd05cc9d2fa36458ce0a58567daeaf5fde7333ba9b403011140" +
        "a4e28911fcf83ab1f457a30b4959efc4b9306f514a4c3711a16a80e3b47eb58b"
    );
  });

  it("tests multiply and hkdf", () => {
    const k1 = new PrivateKey(two);
    const k2 = new PrivateKey(three);

    expect(k1.multiply(k2.publicKey)).toEqual(k2.multiply(k1.publicKey));

    checkHkdf(
      k1,
      k2,
      "6f982d63e8590c9d9b5b4c1959ff80315d772edd8f60287c9361d548d5200f82"
    );
  });

  it("tests hkdf config", () => {
    const k1 = new PrivateKey(two);
    const k2 = new PrivateKey(three);

    ECIES_CONFIG.isHkdfKeyCompressed = true;
    checkHkdf(
      k1,
      k2,
      "b192b226edb3f02da11ef9c6ce4afe1c7e40be304e05ae3b988f4834b1cb6c69"
    );
    ECIES_CONFIG.isHkdfKeyCompressed = false;
  });
});

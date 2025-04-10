const { Mnemonic } = require("ethers");

async function main() {
  const phrase = process.env.SEED_PHRASE;
  if (!phrase) throw new Error("SEED_PHRASE is missing in .env");

  const mnemonic = Mnemonic.fromPhrase(phrase);
  const path = `m/44'/60'/0'/0/0`;

  // Use Wallet from Wallet.createRandom (or import via HDNodeWallet)
  const wallet = mnemonic.derivePath(path);

  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
}

main().catch(console.error);

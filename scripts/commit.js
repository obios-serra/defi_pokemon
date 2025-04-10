const { ethers } = require("hardhat");
const { keccak256, solidityPacked } = require("ethers");

async function main() {
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("PokemonNFT", "0xfbb168167db13084ad1ba877a0aba89acf9af397", signer);

  const hash = keccak256(
    solidityPacked(["string", "string", "uint256", "string"], ["abc", "fire", 1, "secret"])
  );

  const tx = await contract.commitMint(hash);
  await tx.wait();

  console.log("✅ Commit successful!");
}

main().catch((error) => {
  console.error("❌ Commit failed:", error);
  process.exit(1);
});

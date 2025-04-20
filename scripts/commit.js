const { ethers } = require("hardhat");
const { keccak256, solidityPacked } = require("ethers");

async function main() {
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("PokemonNFT", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", signer);

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

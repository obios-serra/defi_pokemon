const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PokemonNFT", function () {
  let owner, user1, user2, nft;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("PokemonNFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();
  });

  it("should deploy with the correct owner", async function () {
    expect(await nft.getOwner()).to.equal(owner.address);
  });

  it("should allow the owner to mint a Pokémon", async function () {
    const tx = await nft.mintPokemon(user1.address, "Pikachu", "Electric", 5);
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment.name === "PokemonMinted");

    expect(event.args.player).to.equal(user1.address);
    expect(await nft.ownerOf(1)).to.equal(user1.address);
  });

  it("should allow a user to commit and reveal a mint", async function () {
    const name = "Charmander";
    const pokeType = "Fire";
    const level = 8;
    const secret = "ash";
    const hash = ethers.keccak256(
        ethers.solidityPacked(
          ["string", "string", "uint256", "string"],
          [name, pokeType, level, secret]
        )
      );

    await nft.connect(user1).commitMint(hash);
    expect(await nft.getCommitHash(user1.address)).to.equal(hash);

    const tx = await nft.connect(user1).revealAndMint(name, pokeType, level, secret);
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment.name === "PokemonMinted");

    expect(event.args.player).to.equal(user1.address);
    expect(await nft.ownerOf(1)).to.equal(user1.address);
    const details = await nft.getPokemonDetails(1);
    expect(details[0]).to.equal(name);
    expect(details[1]).to.equal(pokeType);
    expect(details[2]).to.equal(level);
  });

  it("should allow the owner to pause and prevent minting", async function () {
    await nft.pause();
    await expect(
      nft.mintPokemon(user1.address, "Bulbasaur", "Grass", 5)
    ).to.be.revertedWith("Pausable: paused");

    await nft.unpause();
    await expect(
      nft.mintPokemon(user1.address, "Bulbasaur", "Grass", 5)
    ).to.not.be.reverted;
  });

  it("should allow a Pokémon to be transferred", async function () {
    await nft.mintPokemon(user1.address, "Squirtle", "Water", 6);
    expect(await nft.ownerOf(1)).to.equal(user1.address);

    await nft.connect(user1).transferPokemon(user2.address, 1);
    expect(await nft.ownerOf(1)).to.equal(user2.address);
  });

  it("should revert transfer from non-owner", async function () {
    await nft.mintPokemon(user1.address, "Eevee", "Normal", 10);
    await expect(
      nft.connect(user2).transferPokemon(owner.address, 1)
    ).to.be.revertedWith("You are not the owner of this Pokemon");
  });

  it("should not allow committing twice without cancelling", async function () {
    const hash = ethers.keccak256(
      ethers.solidityPacked(["string", "string", "uint256", "string"], ["Test", "Fire", 1, "secret"])
    );

    await nft.connect(user1).commitMint(hash);
    await expect(nft.connect(user1).commitMint(hash)).to.be.revertedWith("You already have a pending commit.");
  });

  it("should allow cancelling a commit", async function () {
    const hash = ethers.keccak256(
      ethers.solidityPacked(["string", "string", "uint256", "string"], ["Cancel", "Ghost", 3, "trick"])
    );

    await nft.connect(user1).commitMint(hash);
    expect(await nft.getCommitHash(user1.address)).to.equal(hash);

    await nft.connect(user1).cancelCommit();
    expect(await nft.getCommitHash(user1.address)).to.equal(ethers.ZeroHash);
  });
});
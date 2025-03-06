const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy the PokemonNFT contract
    const PokemonNFT = await hre.ethers.getContractFactory("PokemonNFT");
    const pokemonNFT = await PokemonNFT.deploy();
    await pokemonNFT.waitForDeployment();
    console.log("PokemonNFT deployed to:", await pokemonNFT.getAddress());

    // Deploy the PokemonMarket contract and pass the NFT contract address
    const PokemonMarket = await hre.ethers.getContractFactory("PokemonMarket");
    const pokemonMarket = await PokemonMarket.deploy(await pokemonNFT.getAddress());
    await pokemonMarket.waitForDeployment();
    console.log("PokemonMarket deployed to:", await pokemonMarket.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

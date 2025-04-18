require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
//require("./tasks/accounts");

const fs = require("fs");
const path = require("path");

// Custom Task: Export ABI to frontend/src/abis
task("export-all-abis", "Exports all contract ABIs to frontend")
  .setAction(async (_, hre) => {
    const contracts = ["PokemonNFT", "PokemonMarket"]; // Add any other contracts here
    for (const name of contracts) {
      const artifact = await hre.artifacts.readArtifact(name);
      const outputDir = path.resolve(__dirname, "frontend/src/abis");

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, `${name}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(artifact.abi, null, 2));
      console.log(`✅ ABI exported: ${outputPath}`);
    }
  });


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      //accounts: {
      //  mnemonic: process.env.SEED_PHRASE,
     // },
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      //accounts: {
      //  mnemonic: process.env.SEED_PHRASE,
      //},
      chainId: 1337,
    },
  },
};

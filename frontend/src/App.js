import React, { useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import contractAbi from "./abis/PokemonNFT.json";
import marketAbi from "./abis/PokemonMarket.json";

import MintPokemon from "./components/MintPokemon";
import PokemonList from "./components/PokemonList";
import TransferPokemon from "./components/TransferPokemon";
import PokemonTransferHistory from "./components/PokemonTransferHistory";
import Marketplace from "./components/Marketplace";
import MarketplaceListings from "./components/MarketplaceListings";
import AuctionListings from "./components/AuctionListings";
import CreateAuction from "./components/CreateAuction";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [marketContract, setMarketContract] = useState(null);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      const marketContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

      const pokemonNFT = new Contract(contractAddress, contractAbi, signer);
      const pokemonMarket = new Contract(marketContractAddress, marketAbi, signer);

      const userAddress = await signer.getAddress();
      setAccount(userAddress);
      setContract(pokemonNFT);
      setMarketContract(pokemonMarket);

      // Expose for debugging
      window.contract = pokemonNFT;
      window.marketContract = pokemonMarket;
      window.ethers = ethers;
    } catch (error) {
      console.error("Wallet connection error:", error);
      alert("Error connecting wallet. See console.");
    }
  }

  return (
    <div>
      <h1>Decentralized Pokémon Trading</h1>
      {account && contract && marketContract ? (
        <>
          <MintPokemon contract={contract} account={account} />
          <PokemonList contract={contract} account={account} />
          <TransferPokemon contract={contract} account={account} />
          <PokemonTransferHistory contract={contract} />
          <Marketplace marketContract={marketContract} contract={contract} account={account} />
          <MarketplaceListings marketContract={marketContract} nftContract={contract} account={account} />
          <CreateAuction marketContract={marketContract} nftContract={contract} account={account} />
          <AuctionListings marketContract={marketContract} nftContract={contract} account={account} />
        </>
      ) : (
        <button onClick={connectWallet}>Connect MetaMask</button>
      )}
    </div>
  );
}

export default App;

import { useState, useEffect } from "react";
import { ethers } from "ethers";

function Marketplace({ marketContract, contract, account }) {
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPauseStatus = async () => {
      if (contract && typeof contract.paused === "function") {
        try {
          const paused = await contract.paused();
          setIsPaused(paused);
        } catch (err) {
          console.error("Failed to fetch paused status:", err);
        }
      }
      setLoading(false);
    };
    fetchPauseStatus();
  }, [contract]);

  const handleListPokemon = async () => {
    if (isPaused) {
      return alert("Contract is paused. You cannot list Pokémon at this time.");
    }

    // Trim and validate inputs
    const trimmedTokenId = tokenId.toString().trim();
    const trimmedPrice = price.toString().trim();
    if (!trimmedTokenId || !trimmedPrice) {
      return alert("Please enter a valid token ID and price");
    }
    if (isNaN(trimmedTokenId)) {
      return alert("Token ID must be a number");
    }

    try {
      // Confirm ownership
      const owner = await contract.ownerOf(trimmedTokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        return alert("You are not the owner of this token!");
      }

      // Get marketplace address
      const marketplaceAddress = await marketContract.getAddress();

      // Check approval
      const isApprovedForAll = await contract.isApprovedForAll(account, marketplaceAddress);
      if (!isApprovedForAll) {
        console.log("Marketplace not approved. Approving...");
        const tx = await contract.setApprovalForAll(marketplaceAddress, true);
        await tx.wait();
        alert("Marketplace approved for all tokens.");
      } else {
        console.log("Marketplace is already approved.");
      }

      // Convert ETH to wei
      const listingPrice = ethers.parseEther(trimmedPrice);

      // List the Pokémon
      const txList = await marketContract.listPokemonFixedPrice(trimmedTokenId, listingPrice);
      await txList.wait();
      alert("Pokemon listed successfully!");
    } catch (err) {
      console.error("Listing failed:", err);
      alert("Listing failed.");
    }
  };

  return (
    <div>
      <h2>Marketplace</h2>
      {isPaused && <p style={{ color: "red" }}>⏸️ Contract is paused. You cannot list Pokémon.</p>}
      <input
        type="number"
        placeholder="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
      />
      <input
        type="number"
        placeholder="Price in ETH"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <button onClick={handleListPokemon} disabled={isPaused || loading}>
        List Pokemon
      </button>
    </div>
  );
}

export default Marketplace;

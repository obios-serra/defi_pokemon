import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// Component for creating an auction
function CreateAuction({ marketContract, nftContract, account }) {
  const [tokenId, setTokenId] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [duration, setDuration] = useState(""); // in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [loadingPauseStatus, setLoadingPauseStatus] = useState(true);
  const [isCreating, setIsCreating] = useState(false); // new state for auction creation

  useEffect(() => {
    const fetchPauseStatus = async () => {
      if (nftContract && typeof nftContract.paused === "function") {
        try {
          const paused = await nftContract.paused();
          setIsPaused(paused);
        } catch (err) {
          console.error("Error fetching paused status:", err);
        }
      }
      setLoadingPauseStatus(false);
    };
    fetchPauseStatus();
  }, [nftContract]);

  async function createAuction() {
    if (isPaused) {
      alert("Contract is paused. Auctions cannot be created at this time.");
      return;
    }

    if (!tokenId || !startPrice || !duration) {
      alert("Please fill in all fields.");
      return;
    }

    setIsCreating(true);
    try {
      // Approve the marketplace to transfer the NFT
      const approvalTx = await nftContract.approve(marketContract.target, tokenId);
      await approvalTx.wait();

      // Call the auction method
      const tx = await marketContract.listPokemonAuction(
        tokenId,
        ethers.parseEther(startPrice),
        duration
      );

      await tx.wait();
      alert(`Auction created successfully for token ID ${tokenId}.`);

      // Reset fields after creation
      setTokenId("");
      setStartPrice("");
      setDuration("");
    } catch (err) {
      console.error("Auction creation failed:", err);
      alert("Auction creation failed, see console.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div style={{ border: "1px solid #aaa", padding: "1rem", marginTop: "1rem" }}>
      <h2>Create Auction</h2>

      {isPaused && (
        <p style={{ color: "red" }}>
          ⏸️ Contract is paused. You cannot list Pokémon for auction.
        </p>
      )}

      <input
        type="number"
        placeholder="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
        disabled={isCreating}
      />
      <input
        type="text"
        placeholder="Start Price (ETH)"
        value={startPrice}
        onChange={(e) => setStartPrice(e.target.value)}
        disabled={isCreating}
      />
      <input
        type="number"
        placeholder="Duration (seconds)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        disabled={isCreating}
      />
      <button onClick={createAuction} disabled={isPaused || loadingPauseStatus || isCreating}>
        {isCreating ? "Creating Auction..." : "List for Auction"}
      </button>
    </div>
  );
}

export default CreateAuction;

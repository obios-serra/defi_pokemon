import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// This component displays active auctions
function AuctionListings({ marketContract, nftContract, account }) {
  const [auctions, setAuctions] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [loadingPauseStatus, setLoadingPauseStatus] = useState(true);

  useEffect(() => {
    if (!marketContract || !nftContract) return;

    async function fetchAndCheckAuctions() {
      try {
        await loadAuctions();
        await autoEndAuctions();
      } catch (err) {
        console.error("🧨 Error during fetchAndCheckAuctions:", err);
      }
    }

    fetchAndCheckAuctions();
    const interval = setInterval(fetchAndCheckAuctions, 30000);
    return () => clearInterval(interval);
  }, [marketContract, nftContract]);

  useEffect(() => {
    const fetchPauseStatus = async () => {
      if (nftContract && typeof nftContract.paused === "function") {
        try {
          const paused = await nftContract.paused();
          setIsPaused(paused);
        } catch (err) {
          console.error("Failed to fetch paused status:", err);
        }
      }
      setLoadingPauseStatus(false);
    };
    fetchPauseStatus();
  }, [nftContract]);

  async function loadAuctions() {
    try {
      const total = await nftContract.totalSupply();
      // using Promise.all to concurrently fetch auction items
      const items = (
        await Promise.all(
          [...Array(Number(total)).keys()].map(async (i) => {
            const tokenId = i + 1;
            const listingType = await marketContract.listingTypeOf(tokenId);
            if (listingType.toString() !== "2") return null;
            const auctionData = await marketContract.auctions(tokenId);
            const startPriceEth = ethers.formatEther(auctionData.startPrice);
            const highestBidEth = ethers.formatEther(auctionData.highestBid);
            const [name, pokeType, level] = await nftContract.getPokemonDetails(tokenId);
            return {
              tokenId,
              seller: auctionData.seller,
              startPrice: startPriceEth,
              highestBid: highestBidEth,
              highestBidder: auctionData.highestBidder,
              endTime: auctionData.endTime.toString(),
              ended: auctionData.ended,
              name,
              pokeType,
              level: level.toString(),
            };
          })
        )
      ).filter(Boolean);
      setAuctions(items);
    } catch (error) {
      console.error("❌ Error in loadAuctions():", error);
    }
  }

  async function autoEndAuctions() {
    try {
      const total = await nftContract.totalSupply();
      // concurrently check and end auctions if needed
      await Promise.all(
        [...Array(Number(total)).keys()].map(async (i) => {
          const tokenId = i + 1;
          const listingType = await marketContract.listingTypeOf(tokenId);
          if (listingType.toString() !== "2") return;
          const auctionData = await marketContract.auctions(tokenId);
          if (!auctionData.ended && Date.now() / 1000 >= Number(auctionData.endTime)) {
            await endAuction(tokenId);
          }
        })
      );
    } catch (error) {
      console.error("Failed to automatically end auctions:", error);
    }
  }

  async function placeBid(tokenId, bidAmountEth) {
    if (isPaused) {
      return alert("Contract is paused. Bidding is disabled.");
    }

    try {
      const auctionData = await marketContract.auctions(tokenId);
      const startPriceEth = ethers.formatEther(auctionData.startPrice);
      const highestBidEth = ethers.formatEther(auctionData.highestBid);

      const minimumBidEth =
        auctionData.highestBid > 0
          ? parseFloat(highestBidEth) + 0.01
          : parseFloat(startPriceEth);

      if (parseFloat(bidAmountEth.trim()) < minimumBidEth) {
        alert(`Your bid is too low. Minimum acceptable bid is ${minimumBidEth.toFixed(4)} ETH.`);
        return;
      }

      const tx = await marketContract.placeBid(tokenId, {
        value: ethers.parseEther(bidAmountEth),
      });
      await tx.wait();
      alert(`Bid placed successfully for token #${tokenId} with ${bidAmountEth} ETH!`);
      loadAuctions();
    } catch (err) {
      console.error("Bid failed:", err);
      alert("Bid failed. See console for details.");
    }
  }

  async function endAuction(tokenId) {
    if (isPaused) {
      return alert("Contract is paused. Auctions cannot be ended right now.");
    }

    try {
      const tx = await marketContract.endAuction(tokenId);
      await tx.wait();
      alert(`Auction ended for token #${tokenId}.`);
      loadAuctions();
    } catch (err) {
      console.error("End auction failed:", err);
      alert("End auction failed. See console.");
    }
  }

  function formatTimestamp(ts) {
    const date = new Date(Number(ts) * 1000);
    return date.toLocaleString();
  }

  return (
    <div>
      <h2>Active Auctions</h2>

      {isPaused && (
        <p style={{ color: "red" }}>
          ⏸️ Contract is paused. Bidding and ending auctions are disabled.
        </p>
      )}

      <button onClick={loadAuctions} disabled={loadingPauseStatus}>Refresh Auctions</button>

      {auctions.length === 0 ? (
        <p>No auctions found.</p>
      ) : (
        auctions.map((auction) => (
          <div
            key={auction.tokenId}
            style={{ border: "1px solid #ccc", margin: "1rem", padding: "1rem" }}
          >
            <p><strong>Token ID:</strong> {auction.tokenId}</p>
            <p><strong>Name:</strong> {auction.name}</p>
            <p><strong>Type:</strong> {auction.pokeType}</p>
            <p><strong>Level:</strong> {auction.level}</p>
            <p><strong>Seller:</strong> {auction.seller}</p>
            <p><strong>Start Price (ETH):</strong> {auction.startPrice}</p>
            <p><strong>Highest Bid (ETH):</strong> {auction.highestBid}</p>
            <p><strong>Highest Bidder:</strong> {auction.highestBidder}</p>
            <p><strong>Auction End Time:</strong> {formatTimestamp(auction.endTime)}</p>
            <p><strong>Ended:</strong> {auction.ended ? "Yes" : "No"}</p>

            {!auction.ended && (
              <div>
                <input
                  type="text"
                  placeholder="Bid Amount (ETH)"
                  id={`bidAmount-${auction.tokenId}`}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById(`bidAmount-${auction.tokenId}`);
                    if (!input.value) return;
                    placeBid(auction.tokenId, input.value);
                  }}
                  disabled={isPaused || loadingPauseStatus}
                >
                  Place Bid
                </button>
              </div>
            )}

            {!auction.ended && (
              <button
                onClick={() => endAuction(auction.tokenId)}
                disabled={isPaused || loadingPauseStatus}
              >
                End Auction
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AuctionListings;

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// New component for rendering each listing
const ListingItem = ({ listing, account, isPaused, loadingDelist, handleBuy, handleDelist }) => {
  return (
    <div style={{ border: "1px solid #ccc", margin: "1rem", padding: "1rem" }}>
      <p><strong>Token ID:</strong> {listing.tokenId}</p>
      <p><strong>Name:</strong> {listing.name}</p>
      <p><strong>Type:</strong> {listing.pokeType}</p>
      <p><strong>Level:</strong> {listing.level}</p>
      <p><strong>Price (ETH):</strong> {listing.priceEth}</p>
      <p><strong>Seller:</strong> {listing.seller}</p>
      <button
        onClick={() => handleBuy(listing.tokenId, listing.priceEth)}
        disabled={isPaused}
      >
        Buy
      </button>
      {listing.seller.toLowerCase() === account.toLowerCase() && (
        <button
          disabled={isPaused || loadingDelist[listing.tokenId]}
          onClick={() => handleDelist(listing.tokenId)}
          style={{ marginLeft: "10px" }}
        >
          {loadingDelist[listing.tokenId] ? "Delisting..." : "Delist NFT"}
        </button>
      )}
    </div>
  );
};

function MarketplaceListings({ marketContract, nftContract, account }) {
  const [listings, setListings] = useState([]);
  const [loadingDelist, setLoadingDelist] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [loadingPauseStatus, setLoadingPauseStatus] = useState(true);

  const loadListings = useCallback(async () => {
    try {
      const results = [];
      const activeTokenIds = await marketContract.getActiveFixedListings();

      for (let i = 0; i < activeTokenIds.length; i++) {
        const tokenId = activeTokenIds[i];
        const listing = await marketContract.fixedListings(tokenId);

        if (listing.isActive) {
          const priceInEth = ethers.formatEther(listing.price);
          const [name, pokeType, level] = await nftContract.getPokemonDetails(tokenId);

          results.push({
            tokenId,
            seller: listing.seller,
            priceEth: priceInEth,
            name,
            pokeType,
            level: level.toString(),
          });
        }
      }
      setListings(results);
    } catch (error) {
      console.error("Error loading listings:", error);
    }
  }, [marketContract, nftContract]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // 👇 Fetch paused status
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

  // 👇 Blocked when paused
  async function handleBuy(tokenId, priceEth) {
    if (isPaused) {
      return alert("Contract is paused. Buying is temporarily disabled.");
    }

    try {
      const tx = await marketContract.buyPokemonFixedPrice(tokenId, {
        value: ethers.parseEther(priceEth),
      });
      await tx.wait();

      alert(`Bought token #${tokenId} for ${priceEth} ETH`);
      loadListings();
    } catch (err) {
      console.error("Buy failed:", err);
      alert("Purchase failed. Check console for details.");
    }
  }

  async function handleDelist(tokenId) {
    if (isPaused) {
      return alert("Contract is paused. Delisting is temporarily disabled.");
    }

    setLoadingDelist((prev) => ({ ...prev, [tokenId]: true }));
    try {
      const tx = await marketContract.delistPokemonFixedPrice(tokenId);
      await tx.wait();
      alert(`Successfully delisted Pokémon #${tokenId}`);
      loadListings();
    } catch (err) {
      console.error("Delist failed:", err);
      alert("Delisting failed. Check console.");
    }
    setLoadingDelist((prev) => ({ ...prev, [tokenId]: false }));
  }

  return (
    <div>
      <h2>Active Fixed-Price Listings</h2>

      {isPaused && (
        <p style={{ color: "red" }}>
          ⏸️ The contract is paused. Buying and delisting are currently disabled.
        </p>
      )}

      <button
        onClick={loadListings}
        className="mb-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
        disabled={loadingPauseStatus}
      >
        Refresh Listings
      </button>

      {!account ? (
        <p>Please connect your wallet to view listings.</p>
      ) : listings.length === 0 ? (
        <p>No active listings found.</p>
      ) : (
        listings.map((listing) => (
          <ListingItem
            key={listing.tokenId}
            listing={listing}
            account={account}
            isPaused={isPaused || loadingPauseStatus}
            loadingDelist={loadingDelist}
            handleBuy={handleBuy}
            handleDelist={handleDelist}
          />
        ))
      )}
    </div>
  );
}

export default MarketplaceListings;

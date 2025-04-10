import { useState, useEffect } from "react";

function TransferPokemon({ contract, account }) {
  const [recipient, setRecipient] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);  // Add a loading state

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
      setLoading(false);  // Set loading to false once the fetch is complete
    };
    fetchPauseStatus();
  }, [contract]);

  const transferPokemon = async (e) => {
    e && e.preventDefault();
    if (isPaused) {
      return alert("Contract is paused. Transfers are currently disabled.");
    }
    if (!contract) return alert("Contract not connected!");
    if (!recipient || tokenId === "") return alert("Please fill in all fields!");

    try {
      // Parse tokenId to number to ensure correct type.
      const id = Number(tokenId);
      if (isNaN(id)) return alert("Invalid Pokémon ID!");
      
      const tx = await contract.transferPokemon(recipient, id);
      await tx.wait();
      alert(`Pokémon #${id} transferred successfully!`);
      // Optionally clear inputs after success:
      setRecipient("");
      setTokenId("");
    } catch (error) {
      console.error("Transfer failed:", error);
      alert("Transfer failed.");
    }
  };

  return (
    <div>
      <h2>Transfer Pokémon</h2>
      {isPaused && <p style={{ color: "red" }}>⏸️ Contract is paused. Transfers are disabled.</p>}
      <form onSubmit={transferPokemon}>
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          type="number"
          placeholder="Pokémon ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <button type="submit" disabled={isPaused || loading}>
          Transfer
        </button>
      </form>
    </div>
  );
}

export default TransferPokemon;

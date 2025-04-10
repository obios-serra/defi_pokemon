/* global BigInt */
import { useState, useEffect } from "react";
import { ethers, keccak256, solidityPacked } from "ethers";

function MintPokemon({ account, contract }) {
  const [name, setName] = useState("");
  const [pokeType, setPokeType] = useState("");
  const [level, setLevel] = useState("");
  const [secret, setSecret] = useState("");

  const [mintedTokenId, setMintedTokenId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [commitHash, setCommitHash] = useState("");
  const [committed, setCommitted] = useState(false);

  const getValidatedLevel = () => {
    const parsed = parseInt(level);
    if (isNaN(parsed)) {
      alert("Level must be a number.");
      return null;
    }
    return parsed;
  };

  const refreshPausedState = async () => {
    const paused = await contract.paused();
    setIsPaused(paused);
  };

  const extractTransferEvent = (receipt) => {
    return receipt.logs.map(log => {
      try {
        return contract.interface.parseLog(log);
      } catch (_) {
        return null;
      }
    }).find(event => event?.name === "Transfer");
  };

  useEffect(() => {
    const fetchStatus = async () => {
      if (contract && typeof contract.paused === "function") {
        const paused = await contract.paused();
        setIsPaused(paused);
      } else {
        console.error("Contract or contract.paused is undefined");
      }
    };
    fetchStatus();
  }, [contract]);
  

  useEffect(() => {
    const fetchOwner = async () => {
      if (contract && typeof contract.getOwner === "function" && account) {
        const ownerAddress = await contract.getOwner();
        console.log("Contract owner:", ownerAddress);
        console.log("Your address:", account);
      } else {
        console.error("Contract or contract.getOwner is undefined");
      }
    };
    fetchOwner();
  }, [contract, account]);

  const handlePause = async () => {
    try {
      const owner = await contract.getOwner();
      if (account.toLowerCase() !== owner.toLowerCase()) {
        return alert("Only the contract owner can pause it.");
      }

      const tx = await contract.pause({ gasLimit: 150000 });
      await tx.wait();
      alert("Contract paused.");
      await refreshPausedState();
    } catch (err) {
      console.error("Pause failed:", err);
      alert("Failed to pause contract.");
    }
  };

  const handleUnpause = async () => {
    try {
      const tx = await contract.unpause({ gasLimit: 150000 });
      await tx.wait();
      alert("Contract unpaused.");
      await refreshPausedState();
    } catch (err) {
      console.error("Unpause failed:", err);
      alert("Failed to unpause contract.");
    }
  };

  const handleCommit = async () => {
    if (isPaused) {
      return alert("Contract is paused. You cannot commit at the moment.");
    }
  
    if (!name || !pokeType || !level || !secret) {
      alert("Fill all fields including secret.");
      return;
    }
  
    const parsedLevel = getValidatedLevel();
    if (parsedLevel === null) return;
  
    try {
      const commitInfo = await contract.mintCommits(account);
      const { hash } = commitInfo;
  
      if (hash !== ethers.ZeroHash) {
        alert("You already have a pending commit.");
        return;
      }
  
      const commitment = keccak256(
        solidityPacked(["string", "string", "uint256", "string"], [name, pokeType, parsedLevel, secret])
      );
  
      const tx = await contract.commitMint(commitment);
      await tx.wait();
  
      setCommitHash(commitment);
      setCommitted(true);
      alert("Commit sent.");
    } catch (err) {
      console.error("Commit failed:", err);
      alert("Commit failed.");
    }
  };
  

  const handleRevealAndMint = async () => {
    if (isPaused) {
      return alert("Contract is paused. You cannot mint at the moment.");
    }
  
    const parsedLevel = getValidatedLevel();
    if (parsedLevel === null) return;
  
    try {
      const tx = await contract.revealAndMint(name, pokeType, parsedLevel, secret);
      const receipt = await tx.wait();
  
      const event = extractTransferEvent(receipt);
  
      if (event) {
        setMintedTokenId(event.args.tokenId.toString());
        alert(`Pokemon minted with ID ${event.args.tokenId}`);
      } else {
        alert("Minted, but token ID not found.");
      }
  
      setCommitted(false);
      setSecret("");
      setCommitHash("");
    } catch (err) {
      console.error("Reveal failed:", err);
      alert("Reveal failed.");
    }
  };
  
  const handleCancelCommit = async () => {
    if (isPaused) {
      return alert("Contract is paused. Please wait until it is unpaused.");
    }
    try {
      const tx = await contract.cancelCommit();
      await tx.wait();
      alert("Commit cancelled.");
      setCommitted(false);
      setCommitHash("");
    } catch (err) {
      console.error("Cancel failed:", err);
      alert("Cancel failed.");
    }
  };

  const mintPokemon = async () => {
    if (isPaused) {
      return alert("Contract is paused. You cannot mint directly right now.");
    }
  
    const parsedLevel = getValidatedLevel();
    if (parsedLevel === null) return;
  
    try {
      const owner = await contract.getOwner();
      if (account.toLowerCase() !== owner.toLowerCase()) {
        return alert("Only contract owner can mint directly.");
      }
  
      const tx = await contract.mintPokemon(account, name, pokeType, parsedLevel);
      const receipt = await tx.wait();
  
      const event = extractTransferEvent(receipt);
  
      if (event) {
        setMintedTokenId(event.args.tokenId.toString());
        alert(`Pokemon minted with ID ${event.args.tokenId}`);
      } else {
        alert("Minted, but token ID not found.");
      }
    } catch (err) {
      console.error("Minting failed:", err);
      alert("Minting failed.");
    }
  };
  

  return (
    <div>
      <h3>Admin Controls</h3>
      <p>Status: {isPaused ? "⏸️ Paused" : "✅ Active"}</p>
      {isPaused && (
        <p style={{ color: "red" }}>
          ⚠️ Contract is paused. Minting, committing, revealing, and canceling are currently disabled.
        </p>
      )}

      <button onClick={handlePause}>Pause</button>
      <button onClick={handleUnpause}>Unpause</button>

      <h2>Mint Pokémon</h2>
      <input type="text" placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input type="text" placeholder="Type" onChange={(e) => setPokeType(e.target.value)} />
      <input type="number" placeholder="Level" onChange={(e) => setLevel(e.target.value)} />
      <input type="text" placeholder="Secret" onChange={(e) => setSecret(e.target.value)} />

      <h3>Direct Mint (Admin)</h3>
      <button onClick={mintPokemon} disabled={isPaused}>Mint Directly</button>

      <h3>Commit-Reveal Mint</h3>
      {!committed ? (
        <button onClick={handleCommit} disabled={isPaused}>Commit</button>
      ) : (
        <>
          <button onClick={handleRevealAndMint} disabled={isPaused}>Reveal & Mint</button>
          <button onClick={handleCancelCommit} disabled={isPaused}>Cancel Commit</button>
        </>
      )}

      {mintedTokenId && <p>Minted Token ID: {mintedTokenId}</p>}
    </div>
  );
}

export default MintPokemon;

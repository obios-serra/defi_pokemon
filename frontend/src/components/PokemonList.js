import { useState, useEffect, useCallback } from "react";

function PokemonList({ contract, account }) {
  const [pokemonList, setPokemonList] = useState([]);

  const fetchPokemon = useCallback(async () => {
    if (!contract || !account) {
      console.log("Contract or account not initialized.");
      return;
    }

    try {
      const totalSupplyBN = await contract.totalSupply();
      const totalSupply = Number(totalSupplyBN);
      console.log(`Total minted tokens: ${totalSupply}`);

      const tokenFetchPromises = [];
      for (let i = 0; i < totalSupply; i++) {
        tokenFetchPromises.push((async () => {
          try {
            const tokenIdBN = await contract.tokenByIndex(i);
            const tokenId = Number(tokenIdBN);
            const owner = await contract.ownerOf(tokenId);
            if (owner.toLowerCase() !== account.toLowerCase()) return null;
            console.log(`Token ${tokenId} belongs to ${account}`);
            const details = await contract.getPokemonDetails(tokenId);
            return {
              id: tokenId,
              name: details[0],
              type: details[1],
              level: details[2].toString(),
            };
          } catch (innerError) {
            console.error(`Error fetching token at index ${i}:`, innerError);
            return null;
          }
        })());
      }

      const results = await Promise.allSettled(tokenFetchPromises);
      const pokemons = results
        .filter(r => r.status === "fulfilled" && r.value !== null)
        .map(r => r.value);

      console.log("Final Pokémon list:", pokemons);
      setPokemonList(pokemons);
    } catch (error) {
      console.error("Error fetching totalSupply:", error);
    }
  }, [contract, account]);

  useEffect(() => {
    fetchPokemon();
  }, [fetchPokemon]);

  return (
    <div>
      <h2>My Pokémon</h2>
      <button
        onClick={fetchPokemon}
        className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        Refresh Pokémon
      </button>

      {pokemonList.length > 0 ? (
        pokemonList.map((p) => (
          <p key={p.id}>
            {p.id} - {p.name} - {p.type} - Level: {p.level}
          </p>
        ))
      ) : (
        <p>No Pokémon found</p>
      )}
    </div>
  );
}

export default PokemonList;
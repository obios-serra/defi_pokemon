//Import OpenZeppelin’s ERC721 Library
// SPDX-License-Identifier: MIT

//set the Solidity version
pragma solidity ^0.8.20;

//import the ERC721 contract
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

//allow to restrict access (only the contract owner can mint Pokémon)
import "@openzeppelin/contracts/access/Ownable.sol";

//Define the Pokémon NFT contract

//This contract inherits ERC721 and Ownable. It creates NFTs that only the contract owner can mint.
//provide a counter for unique IDs (each Pokémon gets a unique number)
contract PokemonNFT is ERC721, Ownable {
    uint256 private _tokenIds; // Counter for unique Pokémon IDs

    //A struct to store Pokémon details (name, type, level).
    struct Pokemon {
        string name;
        string pokeType;
        uint256 level;
    }

    //A mapping to store metadata for each Pokémon.
    mapping(uint256 => Pokemon) private _pokemonData; // Maps token ID to Pokémon data

    //Initializes the NFT contract with the name "PokemonNFT" and symbol "PKMN".
    constructor() ERC721("PokemonNFT", "PKMN") Ownable() {}

    //A function to mint Pokémon NFTs. Only the contract owner can call it.
    function mintPokemon(address player, string memory name, string memory pokeType, uint256 level) public onlyOwner returns (uint256) {
        _tokenIds += 1; // Manual counter instead of Counters.sol
        uint256 newPokemonId = _tokenIds;

        _mint(player, newPokemonId);
        _pokemonData[newPokemonId] = Pokemon(name, pokeType, level);

        return newPokemonId;
    }

    //A function to retrieve Pokémon data using its ID.
    function getPokemonDetails(uint256 tokenId) public view returns (string memory, string memory, uint256) {
        require(_ownerOf(tokenId) != address(0), "Pokemon does not exist");
        Pokemon memory p = _pokemonData[tokenId];
        return (p.name, p.pokeType, p.level);
    }

    //A function to trasnfer Pokemon between users
    function transferPokemon(address to, uint256 tokenId) public {
        //Check ownership:
        require(ownerOf(tokenId) == msg.sender, "You are not the owner of this Pokemon");
        //Transfers the Pokémon safely:
        safeTransferFrom(msg.sender, to, tokenId);

        //No need to manually update _pokemonData since ownership is already handled by ERC721.
    }
}

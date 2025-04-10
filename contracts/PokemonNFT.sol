// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PokemonNFT is ERC721Enumerable, Ownable, Pausable, ReentrancyGuard {
    uint256 private _tokenIds; // Counter for unique Pokémon IDs

    // Required for ERC721Enumerable
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Struct to store Pokémon details (name, type, level)
    struct Pokemon {
        string name;
        string pokeType;
        uint256 level;
    }

    struct CommitInfo {
        bytes32 hash;
        uint256 timestamp;
    }

    // Mapping to store metadata for each Pokémon by token ID
    mapping(uint256 => Pokemon) private _pokemonData;

    // Tracks each user’s commit (only one pending at a time per address)
    mapping(address => CommitInfo) public mintCommits;

    event PokemonMinted(address indexed player, uint256 indexed tokenId);
    event PokemonTransferred(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor() ERC721("PokemonNFT", "PKMN") {}

    // Internal validation function for Pokémon data
    function _validatePokemonData(string memory name, string memory pokeType, uint256 level) internal pure {
        require(bytes(name).length > 0, "Name required");
        require(bytes(pokeType).length > 0, "Type required");
        require(level > 0, "Level must be > 0");
    }

    // Mint a new Pokémon NFT (only callable by the contract owner)
    function mintPokemon(
        address player,
        string memory name,
        string memory pokeType,
        uint256 level
    ) public onlyOwner whenNotPaused nonReentrant returns (uint256) {
        require(player != address(0), "Invalid player address");
        _validatePokemonData(name, pokeType, level);

        _tokenIds += 1;
        uint256 newPokemonId = _tokenIds;

        _mint(player, newPokemonId);
        _pokemonData[newPokemonId] = Pokemon(name, pokeType, level);

        emit PokemonMinted(player, newPokemonId);
        return newPokemonId;
    }

    function commitMint(bytes32 hash) public whenNotPaused {
        require(hash != bytes32(0), "Hash cannot be zero");
        require(mintCommits[msg.sender].hash == bytes32(0), "You already have a pending commit.");
        mintCommits[msg.sender] = CommitInfo(hash, block.timestamp);
    }

    function cancelCommit() public whenNotPaused {
        require(mintCommits[msg.sender].hash != bytes32(0), "No commit to cancel.");
        mintCommits[msg.sender] = CommitInfo(bytes32(0), 0);
    }
    
    // NEW: Getter for commit hash to avoid struct decoding issues
    function getCommitHash(address user) public view returns (bytes32) {
        return mintCommits[user].hash;
    }

    function revealAndMint(
        string memory name,
        string memory pokeType,
        uint256 level,
        string memory secret
    ) public whenNotPaused nonReentrant returns (uint256) {
        CommitInfo memory info = mintCommits[msg.sender];
        require(info.hash != bytes32(0), "No pending commit found.");

        bytes32 computed = keccak256(abi.encodePacked(name, pokeType, level, secret));
        require(computed == info.hash, "Reveal doesn't match the original commit.");

        _validatePokemonData(name, pokeType, level);

        // Clear commit
        mintCommits[msg.sender] = CommitInfo(bytes32(0), 0);

        _tokenIds += 1;
        uint256 newPokemonId = _tokenIds;

        _mint(msg.sender, newPokemonId);
        _pokemonData[newPokemonId] = Pokemon(name, pokeType, level);

        emit PokemonMinted(msg.sender, newPokemonId);
        return newPokemonId;
    }

    // Retrieve Pokémon details by token ID
    function getPokemonDetails(uint256 tokenId)
        public
        view
        returns (string memory, string memory, uint256)
    {
        require(_exists(tokenId), "Pokemon does not exist");
        Pokemon memory p = _pokemonData[tokenId];
        return (p.name, p.pokeType, p.level);
    }

    // Transfer a Pokémon NFT between users
    function transferPokemon(address to, uint256 tokenId) public whenNotPaused nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "You are not the owner of this Pokemon");
        require(to != address(0), "Cannot transfer to zero address");
        safeTransferFrom(msg.sender, to, tokenId);

        emit PokemonTransferred(msg.sender, to, tokenId);
    }

    function getOwner() public view returns (address) {
        return owner();
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}

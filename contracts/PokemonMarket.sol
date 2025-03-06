// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

//Security features:
//nonReentrant to prevent reentrancy attacks


contract PokemonMarket is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    IERC721 public pokemonNFT;
    mapping(uint256 => Listing) public listings;

    event PokemonListed(uint256 indexed tokenId, address seller, uint256 price);
    event PokemonDelisted(uint256 indexed tokenId);
    event PokemonSold(uint256 indexed tokenId, address buyer, uint256 price);

    constructor(address _pokemonNFT) {
        pokemonNFT = IERC721(_pokemonNFT);
    }

    //Allow users to list a Pokémon for sale:
    function listPokemon(uint256 tokenId, uint256 price) external nonReentrant {
        require(pokemonNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than zero");

        pokemonNFT.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit PokemonListed(tokenId, msg.sender, price);
    }

    //Let the seller cancel their listing:
    function delistPokemon(uint256 tokenId) external nonReentrant {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        require(listings[tokenId].isActive, "Not listed");

        listings[tokenId].isActive = false;
        pokemonNFT.transferFrom(address(this), msg.sender, tokenId);

        emit PokemonDelisted(tokenId);
    }

    //Allow a buyer to purchase a listed Pokémon
    function buyPokemon(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "Not for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        listings[tokenId].isActive = false;
        payable(listing.seller).transfer(listing.price);
        pokemonNFT.transferFrom(address(this), msg.sender, tokenId);

        emit PokemonSold(tokenId, msg.sender, listing.price);
    }
}

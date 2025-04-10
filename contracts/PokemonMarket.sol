// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title PokemonMarketAdvanced
 * @dev Supports both FixedPrice listings and Auction listings,
 *      plus uses pull-payment style for safer fund withdrawals.
 */
contract PokemonMarket is ReentrancyGuard, Ownable {
    enum ListingType {
        None,        // not listed
        FixedPrice,  // direct buy
        Auction      // highest bid
    }

    event TokenListedFixed(uint256 indexed tokenId, address seller, uint256 price);
    event TokenDelisted(uint256 indexed tokenId);
    event TokenListedAuction(uint256 indexed tokenId, address seller, uint256 startPrice, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address winner, uint256 amount);

    struct FixedListing {
        address seller;
        uint256 price;
        bool isActive;
    }

    struct AuctionListing {
        address seller;
        uint256 startPrice;     
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;        
        bool ended;
    }

    IERC721 public immutable pokemonNFT;

    mapping(uint256 => FixedListing) public fixedListings;
    mapping(uint256 => AuctionListing) public auctions;
    mapping(uint256 => ListingType) public listingTypeOf;
    mapping(address => uint256) public pendingWithdrawals;

    uint256[] public activeFixedListings;
    uint256[] public activeAuctionListings;

    constructor(address _pokemonNFT) {
        require(_pokemonNFT != address(0), "Invalid NFT contract address");
        pokemonNFT = IERC721(_pokemonNFT);
    }

    function listPokemonFixedPrice(uint256 tokenId, uint256 price) external nonReentrant {
        require(msg.sender != address(0), "Invalid sender address");
        require(pokemonNFT.ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");
        require(
            pokemonNFT.getApproved(tokenId) == address(this) ||
            pokemonNFT.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        pokemonNFT.transferFrom(msg.sender, address(this), tokenId);

        fixedListings[tokenId] = FixedListing({
            seller: msg.sender,
            price: price,
            isActive: true
        });
        listingTypeOf[tokenId] = ListingType.FixedPrice;
        activeFixedListings.push(tokenId);

        emit TokenListedFixed(tokenId, msg.sender, price);
    }

    function buyPokemonFixedPrice(uint256 tokenId) external payable nonReentrant {
        require(msg.sender != address(0), "Invalid buyer address");
        require(listingTypeOf[tokenId] == ListingType.FixedPrice, "Not fixed-price listing");
        FixedListing storage listing = fixedListings[tokenId];
        require(listing.isActive, "Not for sale");
        require(listing.price > 0, "Invalid price");
        require(msg.value >= listing.price, "Payment < price");

        listing.isActive = false;
        listingTypeOf[tokenId] = ListingType.None;
        _removeActiveFixedListing(tokenId);

        pokemonNFT.transferFrom(address(this), msg.sender, tokenId);

        pendingWithdrawals[listing.seller] += listing.price;

        emit TokenDelisted(tokenId);
    }

    function delistPokemonFixedPrice(uint256 tokenId) external nonReentrant {
        require(msg.sender != address(0), "Invalid address");
        require(listingTypeOf[tokenId] == ListingType.FixedPrice, "Not fixed-price listing");
        FixedListing storage listing = fixedListings[tokenId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.isActive, "Already delisted");

        listing.isActive = false;
        listingTypeOf[tokenId] = ListingType.None;
        _removeActiveFixedListing(tokenId);

        pokemonNFT.transferFrom(address(this), msg.sender, tokenId);

        emit TokenDelisted(tokenId);
    }

    function listPokemonAuction(uint256 tokenId, uint256 startPrice, uint256 durationSecs) external nonReentrant {
        require(msg.sender != address(0), "Invalid address");
        require(pokemonNFT.ownerOf(tokenId) == msg.sender, "Not owner");
        require(startPrice > 0, "Start price must be > 0");
        require(durationSecs > 0, "Duration must be > 0");
        require(
            pokemonNFT.getApproved(tokenId) == address(this) ||
            pokemonNFT.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        pokemonNFT.transferFrom(msg.sender, address(this), tokenId);

        uint256 end = block.timestamp + durationSecs;

        auctions[tokenId] = AuctionListing({
            seller: msg.sender,
            startPrice: startPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: end,
            ended: false
        });
        listingTypeOf[tokenId] = ListingType.Auction;
        activeAuctionListings.push(tokenId);

        emit TokenListedAuction(tokenId, msg.sender, startPrice, end);
    }

    function placeBid(uint256 tokenId) external payable nonReentrant {
        require(msg.sender != address(0), "Invalid bidder address");
        require(listingTypeOf[tokenId] == ListingType.Auction, "Not auction listing");
        AuctionListing storage auction = auctions[tokenId];
        require(!auction.ended, "Already ended");
        require(block.timestamp < auction.endTime, "Auction expired");

        uint256 currentBid = msg.value;
        require(currentBid >= auction.startPrice, "Bid < start price");
        require(currentBid > auction.highestBid, "Bid <= highest bid");

        if (auction.highestBidder != address(0)) {
            pendingWithdrawals[auction.highestBidder] += auction.highestBid;
        }

        auction.highestBid = currentBid;
        auction.highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, currentBid);
    }

    function endAuction(uint256 tokenId) external nonReentrant {
        require(listingTypeOf[tokenId] == ListingType.Auction, "Not auction listing");
        AuctionListing storage auction = auctions[tokenId];
        require(!auction.ended, "Already ended");
        require(block.timestamp >= auction.endTime, "Not ended yet");

        auction.ended = true;
        listingTypeOf[tokenId] = ListingType.None;
        _removeActiveAuctionListing(tokenId);

        if (auction.highestBidder == address(0)) {
            pokemonNFT.transferFrom(address(this), auction.seller, tokenId);
        } else {
            pokemonNFT.transferFrom(address(this), auction.highestBidder, tokenId);
            pendingWithdrawals[auction.seller] += auction.highestBid;
        }

        emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
    }

    function withdraw() external nonReentrant {
        require(msg.sender != address(0), "Invalid withdrawal address");
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Withdraw failed");
    }

    receive() external payable {}

    function _removeActiveFixedListing(uint256 tokenId) internal {
        for (uint i = 0; i < activeFixedListings.length; i++) {
            if (activeFixedListings[i] == tokenId) {
                activeFixedListings[i] = activeFixedListings[activeFixedListings.length - 1];
                activeFixedListings.pop();
                break;
            }
        }
    }

    function _removeActiveAuctionListing(uint256 tokenId) internal {
        for (uint i = 0; i < activeAuctionListings.length; i++) {
            if (activeAuctionListings[i] == tokenId) {
                activeAuctionListings[i] = activeAuctionListings[activeAuctionListings.length - 1];
                activeAuctionListings.pop();
                break;
            }
        }
    }

    function getActiveFixedListings() external view returns (uint256[] memory) {
        return activeFixedListings;
    }

    function getActiveAuctionListings() external view returns (uint256[] memory) {
        return activeAuctionListings;
    }
}

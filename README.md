# Decentralized Pokémon Trading Platform

This project is a decentralized application (dApp) for trading Pokémon NFTs. It includes smart contracts, a frontend, and scripts for deployment and interaction. The platform supports minting, transferring, listing, and auctioning Pokémon NFTs.

## Features

- **Mint Pokémon**: Users can mint Pokémon NFTs with unique attributes.
- **Transfer Pokémon**: Users can transfer Pokémon NFTs to other addresses.
- **Marketplace**: Fixed-price listings for buying and selling Pokémon NFTs.
- **Auctions**: Create and participate in auctions for Pokémon NFTs.
- **Pause/Unpause**: Admins can pause or unpause the contract to disable certain functionalities.

## Project Structure

### Smart Contracts

1. **PokemonNFT.sol**  
   - Implements the ERC721 standard with additional features like minting, commit-reveal minting, and pausing.
   - Events: `PokemonMinted`, `PokemonTransferred`.
   - Functions:
     - `mintPokemon`: Admin-only minting.
     - `commitMint` and `revealAndMint`: Commit-reveal minting mechanism.
     - `transferPokemon`: Transfer Pokémon NFTs.
     - `pause` and `unpause`: Admin controls for pausing the contract.

2. **PokemonMarket.sol**  
   - Implements a marketplace for fixed-price listings and auctions.
   - Events: `TokenListedFixed`, `TokenDelisted`, `TokenListedAuction`, `BidPlaced`, `AuctionEnded`.
   - Functions:
     - `listPokemonFixedPrice` and `buyPokemonFixedPrice`: Fixed-price marketplace.
     - `listPokemonAuction`, `placeBid`, and `endAuction`: Auction functionality.
     - `withdraw`: Withdraw funds from sales or outbid auctions.

### Frontend

The frontend is built with React and uses the `ethers` library for blockchain interactions.

#### Components

- **App.js**: Main entry point, handles wallet connection and renders other components.
- **MintPokemon.js**: Allows users to mint Pokémon NFTs using direct minting or commit-reveal.
- **TransferPokemon.js**: Enables users to transfer Pokémon NFTs to other addresses.
- **PokemonList.js**: Displays the user's Pokémon collection.
- **Marketplace.js**: Lists Pokémon for fixed-price sales.
- **MarketplaceListings.js**: Displays active fixed-price listings and allows buying or delisting.
- **CreateAuction.js**: Enables users to create auctions for their Pokémon NFTs.
- **AuctionListings.js**: Displays active auctions and allows bidding or ending auctions.
- **PokemonTransferHistory.js**: Shows the transfer history of Pokémon NFTs.

### Scripts

1. **deploy.js**  
   - Deploys the `PokemonNFT` and `PokemonMarket` contracts.

2. **commit.js**  
   - Demonstrates the commit-reveal minting process.

3. **show-private-key.js**  
   - Derives and displays the private key from the mnemonic in the `.env` file.

### Tests

- **Lock.js**: Example test file for a sample contract, demonstrating Hardhat's testing capabilities.
- **Comprehensive Test Suite**: A complete test suite for `PokemonNFT` and `PokemonMarket` contracts is required to validate minting, transferring, listing, bidding, and withdrawing functionalities.

### Configuration

1. **.env**  
   - Contains the mnemonic for deploying contracts and interacting with the blockchain.

2. **hardhat.config.js**  
   - Configures the Hardhat environment, including networks and custom tasks.

3. **package.json** (Frontend)  
   - Lists dependencies and scripts for the React frontend.

### ABIs

- Located in `frontend/src/abis`, these files contain the contract ABIs for interaction with the frontend.

## Setup and Usage

### Prerequisites

- Node.js and npm
- Hardhat
- MetaMask browser extension

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd defi_pokemon
   ```

2. Install dependencies:
   ```bash
   npm install
   cd frontend
   npm install
   ```

3. Configure the `.env` file with your mnemonic:
   ```plaintext
   SEED_PHRASE="your mnemonic here"
   ```

### Deployment

1. Start a local blockchain:
   ```bash
   npx hardhat node
   ```

2. Deploy the contracts:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Running the Frontend

1. Start the React development server:
   ```bash
   cd frontend
   npm start
   ```

2. Open the app in your browser at `http://localhost:3000`.

### Testing

1. Run the test suite:
   ```bash
   npx hardhat test
   ```

2. Generate a test coverage report:
   ```bash
   npx hardhat coverage
   ```

### Interacting with the dApp

- Connect your MetaMask wallet.
- Mint, transfer, list, or auction Pokémon NFTs using the provided UI.

## Tokenomics

- **Minting Costs**: Admin-only minting is free, while commit-reveal minting may include a fee (if implemented).
- **Auction Fees**: No platform fees are currently implemented, but this can be extended in the future.

## Commit-Reveal Mechanism

The commit-reveal mechanism prevents front-running attacks during minting. Here's how it works:

1. **Commit Phase**:
   - The user submits a hash of the Pokémon details and a secret.
   - This hash is stored on-chain.

2. **Reveal Phase**:
   - The user reveals the Pokémon details and the secret.
   - The contract verifies the hash matches the commit.
   - If valid, the Pokémon is minted.

3. **Cancel Commit**:
   - Users can cancel their commit if they decide not to proceed.

## Security Features

The platform incorporates several security measures to ensure safe and reliable operations:

1. **Reentrancy Protection**:
   - Both `PokemonNFT` and `PokemonMarket` contracts use OpenZeppelin's `ReentrancyGuard` to prevent reentrancy attacks.

2. **Access Control**:
   - Admin-only functions (e.g., `mintPokemon`, `pause`, `unpause`) are restricted to the contract owner using OpenZeppelin's `Ownable` module.

3. **Pause Mechanism**:
   - The `PokemonNFT` contract includes a pausing mechanism to temporarily disable critical functions during emergencies.

4. **Commit-Reveal Scheme**:
   - The minting process supports a commit-reveal mechanism to prevent front-running attacks.

5. **Pull-Payment Model**:
   - The `PokemonMarket` contract uses a pull-payment model for fund withdrawals, ensuring that funds are not directly sent during transactions, reducing the risk of failed transfers.

6. **Input Validation**:
   - Functions validate inputs (e.g., non-zero addresses, positive values) to prevent invalid or malicious data from being processed.

7. **Approval Checks**:
   - The marketplace ensures that NFTs are approved for transfer before listing or auctioning.

8. **Safe Transfers**:
   - All NFT transfers use `safeTransferFrom` to ensure compliance with the ERC721 standard and prevent accidental loss of tokens.

9. **Gas Limit Management**:
   - Functions include gas limit recommendations to prevent out-of-gas errors during critical operations.

10. **Event Logging**:
    - Key actions (e.g., minting, transferring, listing, bidding) emit events for transparency and easier debugging.

## Custom Tasks

- Export ABIs to the frontend:
  ```bash
  npx hardhat export-all-abis
  ```

## Deliverables

- **Source Code**: Complete source code for smart contracts, frontend, and scripts.
- **Test Suite**: Comprehensive tests for all functionalities.
- **Documentation**: Detailed `README.md` with setup instructions, technical documentation, and tokenomics.
- **Demonstration Video**: A three-minute video showcasing the platform's functionality.

## License

This project is licensed under the MIT License.
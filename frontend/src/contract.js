import { BrowserProvider, Contract } from "ethers";
import PokemonNFT from "./abis/PokemonNFT.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export async function getPokemonContract() {
  if (!window.ethereum) {
    throw new Error("🦊 MetaMask not found. Please install it.");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const abi = PokemonNFT;
  const contract = new Contract(CONTRACT_ADDRESS, abi, signer);

  contract.on = contract.addListener; // polyfill to support contract.on

  // Improved logging of ABI function names
  console.log("🧬 ABI functions:", abi.map(f => f.name).filter(Boolean));

  // Assign write instance once to avoid duplicate connections
  const write = contract.connect(signer);

  return {
    read: contract,
    write,
    estimateGas: { write },
    interface: contract.interface,
    address: CONTRACT_ADDRESS,
  };
}

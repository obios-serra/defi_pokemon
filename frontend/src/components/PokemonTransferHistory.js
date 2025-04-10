import { useState, useEffect, useCallback } from "react";

function PokemonTransferHistory({ contract }) {
  const [transferEvents, setTransferEvents] = useState([]);

  // Memoized fetch function with destructuring
  const fetchTransferHistory = useCallback(async () => {
    if (!contract) return;
    try {
      const filter = contract.filters.Transfer();
      const events = await contract.queryFilter(filter);
      const formattedEvents = events.map(({ args, transactionHash }) => ({
        from: args.from,
        to: args.to,
        tokenId: args.tokenId.toString(),
        transactionHash,
      }));
      setTransferEvents(formattedEvents);
    } catch (error) {
      console.error("Failed to fetch transfer history:", error);
    }
  }, [contract]);

  // Initial fetch when contract is available
  useEffect(() => {
    if (!contract) return;
    fetchTransferHistory();
  }, [contract, fetchTransferHistory]);

  // Subscribe to the Transfer event using destructured listener parameters
  useEffect(() => {
    if (!contract) return;

    const listener = (from, to, tokenId, event) => {
      setTransferEvents(prevEvents => ([
        {
          from,
          to,
          tokenId: tokenId.toString(),
          transactionHash: event.transactionHash,
        },
        ...prevEvents,
      ]));
    };

    contract.on("Transfer", listener);
    return () => {
      contract.off("Transfer", listener);
    };
  }, [contract]);

  return (
    <div>
      <h2>Pokémon Transfer History</h2>
      <button onClick={fetchTransferHistory}>Refresh History</button>
      {transferEvents.length === 0 ? (
        <p>No transfers yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Pokémon ID</th>
              <th>Transaction</th>
            </tr>
          </thead>
          <tbody>
            {transferEvents.map((event, index) => (
              <tr key={index}>
                <td>{event.from}</td>
                <td>{event.to}</td>
                <td>{event.tokenId}</td>
                <td>
                  <a
                    href={`https://etherscan.io/tx/${event.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PokemonTransferHistory;

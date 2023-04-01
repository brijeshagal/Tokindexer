import { Alchemy, Network, Utils } from "alchemy-sdk";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import "./index.css";

function App() {
  const [userAddress, setUserAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [typeToken, setTypeToken] = useState("erc20");

  async function connectWallet() {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const newAccount = provider.getSigner();
      const address = await newAccount.getAddress();
      setUserAddress(address);
      setSearchAddress(address);
    } else {
      console.log("Please Install MetaMask!!!");
    }
  }

  async function getTokens() {
    setIsLoading(true);
    const settings = {
      apiKey: import.meta.env.VITE_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(settings);

    if (!searchAddress) {
      setErrorMessage("Missing address");
      setHasQueried(false);
      setIsLoading(false);
      return false;
    }
    setErrorMessage("");

    const isAddress = ethers.utils.isAddress(searchAddress);
    if (!isAddress) {
      setHasQueried(false);
      setIsLoading(false);
      setErrorMessage("Invalid Address");
      return false;
    }

    try {
      setResults([]);
      let data;
      if (typeToken === "erc20") {
        data = await alchemy.core.getTokenBalances(searchAddress);
        data.tokenBalances = data.tokenBalances
          .map((item) => {
            item.tokenBalance = item.tokenBalance.toString();
            return item;
          })
          .filter((item) => item.tokenBalance > 0);
        const newData = [];
        for (const token of data.tokenBalances) {
          const res = await alchemy.core.getTokenMetadata(
            token.contractAddress
          );
          res.tokenBalance = token.tokenBalance.toString();
          newData.push(res);
        }
        console.log(newData);
        setResults(newData);
      } else {
        data = await alchemy.nft.getNftsForOwner(searchAddress);

        console.log(data.ownedNfts);
        setResults(data.ownedNfts);
      }
    } catch (err) {
      // Reset results
      setTokenDataObjects([]);
      setResults([]);
      console.log(err);
      // Set error message
      if (err.message.includes("ENS name not configured")) {
        setErrorMessage("Check address or ENS name");
      } else {
        setErrorMessage("Fetch Error");
      }
    }
    setHasQueried(true);
    setIsLoading(false);
  }
  useEffect(() => {
    async function fetch() {
      if (hasQueried) {
        await getTokens();
      }
      setIsLoading(false);
    }
    fetch();
  }, [typeToken, hasQueried]);
  return (
    <div className="main">
      <div className="nav">
        <div className="">Tokindexer</div>
        <div className="">Get all the ERC-20/ERC-721</div>
        <div className="">
          {userAddress.length > 0 ? (
            <button className="connect" title={userAddress}>
              {userAddress.substring(0, 7)}...{userAddress.substring(37)}
            </button>
          ) : (
            <button className="connect" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      <div className="content">
        <div>Connect Wallet to Automatically read your address</div>
        <form className="container">
          <div className="container">Enter the address:</div>
          <input
            onChange={(e) => {
              setHasQueried(false);
              setSearchAddress(e.target.value);
            }}
            required
            value={searchAddress}
          />
          <button
            type="submit"
            className="connect"
            onClick={(e) => {
              e.preventDefault();
              getTokens();
            }}
          >
            Search
          </button>
        </form>
        {errorMessage !== "" && <p className="errorMessage">{errorMessage}</p>}
        <div className="container">
          <button
            id="erc20"
            className="unselected selected"
            onClick={() => {
              if (typeToken !== "erc20") {
                const str = "erc20";
                setTypeToken(str);
                var e = document.getElementById("erc20");
                e.classList.toggle("selected");
                setIsLoading(true);
              }
            }}
          >
            ERC 20
          </button>
          <button
            id="erc721"
            className="unselected"
            onClick={() => {
              if (typeToken !== "erc721") {
                const str = "erc721";
                setTypeToken(str);
                var e = document.getElementById("erc721");
                e.classList.toggle("selected");
                setIsLoading(true);
              }
            }}
          >
            ERC721
          </button>
        </div>
        {isLoading ? (
          <div>
            <BiLoaderAlt />
          </div>
        ) : (
          hasQueried &&
          searchAddress?.length > 0 && (
            <div>
              {typeToken === "erc20" ? (
                results.length > 0 ? (
                  <div className="containerTable">
                    {results?.map((e, i) => {
                      return (
                        <div className="results" key={i}>
                          <img src={e.logo ? e.logo : ""}></img>
                          <div>Name: {e.name}</div>
                          <div>Symbol: {e.symbol}</div>
                          <div>
                            Balance:
                            {ethers.utils.formatUnits(
                              e.tokenBalance,
                              e.decimals
                            ) /
                              10 ** e.decimals}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="noTokens">
                    No tokens with positive balance found
                  </p>
                )
              ) : (
                ""
              )}

              {typeToken === "erc721" ? (
                results?.length > 0 ? (
                  <div>
                    <div>ERC-721 tokens:</div>

                    <div>
                      <div className="containerTable">
                        {results?.map((e, i) => {
                          return (
                            <div key={i}>
                              {e?.media?.length > 0 &&
                              (e?.media[0]?.format === "jpg" ||
                                e?.media[0]?.format === "jpeg" ||
                                e?.media[0]?.format === "png") ? (
                                <img src={e?.media[0]?.format} />
                              ) : (
                                <p className="noTokens">Media not found</p>
                              )}
                              <div>
                                <b>Name:</b> {e.contract.name}
                                <br />
                                <b>ID:</b> #{e.tokenId} <br />
                                <b>Address:</b> {e.contract.address.slice(0, 5)}
                                ...
                                {e.contract.address.slice(-4)}
                                <div>
                                  {/* <i
                            className="pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(e.contract.address);
                            }}
                          >
                            <ul>(click for copy)</ul>
                          </i> */}
                                </div>
                                <br />
                                <p>
                                  Opensea:
                                  <a
                                    href={`https://opensea.io/assets/ethereum/${e.contract.address}/${e.tokenId}`}
                                    title=""
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Link
                                  </a>
                                </p>{" "}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div>Note: only the first 100 results are shown</div>
                    </div>
                  </div>
                ) : (
                  <p className="noTokens">No NFTs found!</p>
                )
              ) : (
                ""
              )}
            </div>
          )
        )}{" "}
      </div>
    </div>
  );
}

export default App;

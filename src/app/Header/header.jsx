import React, { useState } from "react";
import "./header.css";
import { Link } from "react-router-dom";

const Header = () => {
  const [walletAddress, setWalletAddress] = useState("");

  // Function to connect MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        setWalletAddress(accounts[0]);

        console.log("Connected Wallet Address:", accounts[0]);
      } catch (error) {
        if (error.code === 4001) {
          // User rejected the request
          console.error("Connection rejected by user.");
        } else {
          console.error("Error connecting to MetaMask:", error);
        }
      }
    } else {
      // Notify the user if MetaMask is not installed
      alert("MetaMask is not installed. Please install the MetaMask extension in your browser.");
    }
  };

  return (
    <div className="header">
      {/* Left Section: Logo */}
      <div className="logo">
        <Link to="/ " className="custom-logo">
          CoinCraft
        </Link>
      </div>

      {/* Center Section: Navigation */}
      <div className="nav">
        <Link to="/project-listing" className="nav-link">
          Project Listing
        </Link>
        <Link to="/find-project" className="nav-link">
          Find Project
        </Link>
        <Link to="/be-a-verifier" className="nav-link">
          Be a Verifier
        </Link>
      </div>

      {/* Right Section: Connect Wallet */}
      <div className="button-container">
        <div className="wallet-button">
          {walletAddress ? (
            <button>
              {walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)}
            </button>
          ) : (
            <button onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;

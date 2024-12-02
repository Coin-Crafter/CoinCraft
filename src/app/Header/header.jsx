import React, { useState, useEffect } from "react";
import "./header.css";
import { Link } from "react-router-dom";

const Header = () => {
  const [walletAddress, setWalletAddress] = useState("");

  // Function to handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
      console.log("Account changed to:", accounts[0]);
    } else {
      setWalletAddress("");
      console.log("All accounts disconnected.");
    }
  };

  // Function to connect MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log("Connected Wallet Address:", accounts[0]);
        } else {
          console.log("No accounts found.");
        }
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
      alert(
        "MetaMask is not installed. Please install the MetaMask extension in your browser."
      );
    }
  };

  // Check if wallet is already connected on page load and set up event listeners
  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          // Request the user's accounts
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            console.log("Wallet is already connected:", accounts[0]);
          } else {
            console.log("No connected wallet found.");
          }

          // Listen for account changes
          window.ethereum.on("accountsChanged", handleAccountsChanged);
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      } else {
        console.log("MetaMask is not installed.");
      }
    };

    checkIfWalletIsConnected();

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

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
        <Link to="/your-projects" className="nav-link">
          Your Projects
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

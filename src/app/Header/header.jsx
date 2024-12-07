import React, { useState } from "react";
import "./header.css";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileDetails, setProfileDetails] = useState({
    name: "",
    email: "",
    description: "",
  });

  const navigate = useNavigate();

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
          console.error("Connection rejected by user.");
        } else {
          console.error("Error connecting to MetaMask:", error);
        }
      }
    } else {
      alert("MetaMask is not installed. Please install the MetaMask extension in your browser.");
    }
  };

  // Handle input change in the profile form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  // Save profile details and close modal
  const saveProfile = () => {
    console.log("Profile saved:", profileDetails);
    setIsProfileOpen(false);
  };

  return (
    <div className="header">
      {/* Left Section: Logo */}
      <div className="logo">
        <Link to="/" className="custom-logo">
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
            <button onClick={() => setIsProfileOpen(true)}>
              {walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)}
            </button>
          ) : (
            <button onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Profile</h2>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={profileDetails.name}
              onChange={handleInputChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={profileDetails.email}
              onChange={handleInputChange}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={profileDetails.description}
              onChange={handleInputChange}
              rows="4"
            ></textarea>
            <div className="modal-buttons">
              <button onClick={saveProfile}>Save</button>
              <button onClick={() => setIsProfileOpen(false)}>Close</button>
              <button onClick={() => navigate("/users")}>Manage Users</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;

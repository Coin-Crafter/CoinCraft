import React from "react";
import "./header.css";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className="header">
      {/* Left Section: Logo */}
      <div className="logo">
        <Link to="/ " className="custom-logo">
          {" "}
          CoinCraft
        </Link>
      </div>

      {/* Center Section: Navigation */}
      <div className="nav">
        <Link to="/project-listing" className="nav-link">
          {" "}
          Project Listing
        </Link>
        <Link to="/find-project" className="nav-link">
          {" "}
          Find project
        </Link>
        <Link to="/be-a-verifier" className="nav-link">
          {" "}
          Be a Verifier
        </Link>
      </div>

      {/* Right Section: Connect Wallet */}
      <div className="button-container">
        <div className="wallet-button">
          <button>Connect Wallet</button>
        </div>
      </div>
    </div>
  );
};

export default Header;

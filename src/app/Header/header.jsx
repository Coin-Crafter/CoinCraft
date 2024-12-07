import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase.jsx"; // Import Firebase configuration
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./header.css";

const Header = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileDetails, setProfileDetails] = useState({
    profilePicture: "",
    name: "",
    projectsCompleted: 0,
    description: "",
    githubLink: "",
    linkedinLink: "",
    walletAddress: "",
  });

  const navigate = useNavigate();

  // Function to connect MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const walletAddress = accounts[0];
        setWalletAddress(walletAddress);

        // Check if profile exists for this wallet address
        const docRef = doc(db, "profiles", walletAddress);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // Create a new profile with empty fields if not exists
          const newProfile = {
            profilePicture: "",
            name: "",
            projectsCompleted: 0,
            description: "",
            githubLink: "",
            linkedinLink: "",
            walletAddress: walletAddress,
          };

          // Save new profile to Firestore
          await setDoc(docRef, newProfile);

          // Update local state with new profile
          setProfileDetails(newProfile);

          console.log("New profile created for wallet:", walletAddress);
        } else {
          // If profile exists, fetch and set the existing profile details
          setProfileDetails(docSnap.data());
        }

        console.log("Wallet address connected:", walletAddress);
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      alert("MetaMask is not installed.");
    }
  };

  // Fetch profile details from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (walletAddress) {
        const docRef = doc(db, "profiles", walletAddress);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileDetails(docSnap.data());
        }
      }
    };
    fetchProfile();
  }, [walletAddress]);

  // Save profile details to Firestore
  const saveProfile = async () => {
    if (profileDetails.profilePicture && !isValidImageURL(profileDetails.profilePicture)) {
      alert("Please enter a valid image URL (jpg, png, gif, webp).");
      return;
    }

    try {
      const docRef = doc(db, "profiles", walletAddress);
      await setDoc(docRef, {
        ...profileDetails,
        walletAddress: walletAddress,
      });

      // Reflect the changes in the UI
      setProfileDetails((prev) => ({ ...prev, walletAddress }));
      console.log("Profile updated:", profileDetails);
      setIsEditModalOpen(false); // Close the modal
      setIsProfileOpen(false); // Close the profile modal if open
    } catch (error) {
      console.error("Error saving profile details:", error);
    }
  };

  // Helper function to validate image URL
  const isValidImageURL = (url) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  // Handle input change in the edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
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
        <div className="full-page-modal">
          <div className="profile-content">
            <div className="profile-header">
              <img
                src={profileDetails.profilePicture || "https://via.placeholder.com/150"}
                alt="Profile"
                className="profile-picture"
              />
              <h2>{profileDetails.name}</h2>
            </div>
            <p>Projects Completed: {profileDetails.projectsCompleted}</p>
            <p className="description">{profileDetails.description}</p>
            <div className="icon-container">
              <a href={profileDetails.githubLink} target="_blank" rel="noopener noreferrer">
                <img
                  src={process.env.PUBLIC_URL + "/asset/github-icon.png"}
                  alt="GitHub"
                  className="icon-1"
                />
              </a>
              <a href={profileDetails.linkedinLink} target="_blank" rel="noopener noreferrer">
                <img
                  src={process.env.PUBLIC_URL + "/asset/linkedin-icon.png"}
                  alt="LinkedIn"
                  className="icon-2"
                />
              </a>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setIsEditModalOpen(true)}>Edit Profile</button>
              <button onClick={() => setIsProfileOpen(false)}>Close</button>
              <button onClick={() => navigate("/users")}>Manage Users</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Profile</h2>
            <input
              type="text"
              name="profilePicture"
              placeholder="Paste online image URL"
              value={profileDetails.profilePicture}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={profileDetails.name}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="projectsCompleted"
              placeholder="Projects Completed"
              value={profileDetails.projectsCompleted}
              onChange={handleInputChange}
            />
            <textarea
              name="description"
              placeholder="Description/Bio"
              value={profileDetails.description}
              onChange={handleInputChange}
              rows="4"
            ></textarea>
            <input
              type="url"
              name="githubLink"
              placeholder="GitHub Link"
              value={profileDetails.githubLink}
              onChange={handleInputChange}
            />
            <input
              type="url"
              name="linkedinLink"
              placeholder="LinkedIn Link"
              value={profileDetails.linkedinLink}
              onChange={handleInputChange}
            />
            <div className="modal-buttons">
              <button onClick={saveProfile}>Save</button>
              <button onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;

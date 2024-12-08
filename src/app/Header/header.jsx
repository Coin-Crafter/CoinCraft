import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase.jsx"; // Import Firebase configuration
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./header.css";
import { BrowserProvider, Contract } from "ethers";
import { contractAddress } from "../../contract/contractAddress";
import contractABI from "../../contract/contractABI.json";



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

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      console.log("refreshing now");
      window.location.reload();
      setWalletAddress(accounts[0]);
      console.log("Account changed to:", accounts[0]);
    } else {
      window.location.reload();
      setWalletAddress("");
      console.log("All accounts disconnected.");
    }
  };

  // Fetch Completed Projects Count
const fetchCompletedProjectsCount = async (freelancerWallet) => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed!");
    }

    // Connect to Ethereum and contract
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, contractABI, signer);

    // Fetch all completed projects from the contract
    const completedProjects = await contract.getProjectsByStatus(4n); // Status Completed

    // Filter projects matching the freelancer's wallet address
    const filteredProjects = completedProjects.filter(
      (project) =>
        project.selectedFreelancer.toLowerCase() === freelancerWallet.toLowerCase()
    );

    return filteredProjects.length;
  } catch (error) {
    console.error("Error fetching completed projects count:", error);
    return 0;
  }
};


  // Function to connect MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const walletAddress = accounts[0];
        setWalletAddress(walletAddress);

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log("Connected Wallet Address:", accounts[0]);
        } else {
          console.log("No accounts found.");
        }

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
        if (error.code === 4001) {
          // User rejected the request
          console.error("Connection rejected by user.");
        } else {
          console.error("Error connecting to MetaMask:", error);
        }
      }
    } else {
      alert("MetaMask is not installed. Please install the MetaMask extension in your browser.");
    }
  };

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

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);


  // Fetch profile details from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (walletAddress) {
        const docRef = doc(db, "profiles", walletAddress);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const fetchedProfile = docSnap.data();
          setProfileDetails(fetchedProfile);

          // If name is empty, open profile and edit modal automatically
          if (!fetchedProfile.name) {
            setIsProfileOpen(true);
            setIsEditModalOpen(true);
          }
        }
      }
    };
    fetchProfile();
  }, [walletAddress]);

  useEffect(() => {
    const fetchFreelancerProfile = async () => {
      if (walletAddress) {
        const docRef = doc(db, "profiles", walletAddress);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const fetchedProfile = docSnap.data();
  
          // Fetch the number of completed projects
          const completedCount = await fetchCompletedProjectsCount(walletAddress);
  
          // Update profile with completed projects count
          setProfileDetails({
            ...fetchedProfile,
            projectsCompleted: completedCount,
          });
        }
      }
    };
  
    fetchFreelancerProfile();
  }, [walletAddress]);
  

  // Save profile details to Firestore
  const saveProfile = async () => {
    // Check if name is empty again before saving
    if (!profileDetails.name.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    if (profileDetails.profilePicture && !isValidImageURL(profileDetails.profilePicture)) {
      // Since we now store data URLs, this validation might not be necessary
      // But if we still want to ensure image format, you can skip this
      // For now, let's remove this validation since we store a data URL.
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
  // Not necessary if we are using data URLs
  const isValidImageURL = (url) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  // Handle input change in the edit form (for text fields)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert file to a Data URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setProfileDetails((prev) => ({
        ...prev,
        profilePicture: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
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
              <h2>{profileDetails.name || "No Name Set"}</h2>
            </div>
            <p>Projects Completed: {profileDetails.projectsCompleted || 0}</p>
            <p className="description">{profileDetails.description}</p>
            <div className="icon-container">
            {profileDetails.githubLink && !profileDetails.linkedinLink && (
              <a
                href={profileDetails.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="single-icon"
              >
                <img
                  src={process.env.PUBLIC_URL + "/asset/github-icon.png"}
                  alt="GitHub"
                  className="icon-centered"
                />
              </a>
            )}

            {profileDetails.linkedinLink && !profileDetails.githubLink && (
              <a
                href={profileDetails.linkedinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="single-icon"
              >
                <img
                  src={process.env.PUBLIC_URL + "/asset/linkedin-icon.png"}
                  alt="LinkedIn"
                  className="icon-centered"
                />
              </a>
            )}

            {profileDetails.githubLink && profileDetails.linkedinLink && (
              <>
                <a
                  href={profileDetails.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-wrapper"
                >
                  <img
                    src={process.env.PUBLIC_URL + "/asset/github-icon.png"}
                    alt="GitHub"
                    className="icon"
                  />
                </a>
                <a
                  href={profileDetails.linkedinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-wrapper"
                >
                  <img
                    src={process.env.PUBLIC_URL + "/asset/linkedin-icon.png"}
                    alt="LinkedIn"
                    className="icon"
                  />
                </a>
              </>
            )}
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
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={profileDetails.name}
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

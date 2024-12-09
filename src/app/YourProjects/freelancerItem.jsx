import React, { useState, useEffect } from "react";
import { db } from "../../firebase.jsx";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const fetchUserProfile = async (walletAddress) => {
  let allData = [];

  try {
    console.log("INSIDE FETCH USER PROFILE");
    const allUsersData = collection(db, "profiles");
    const allUsersSnapshot = await getDocs(allUsersData);
    console.log("Searching for wallet address:", walletAddress);
    const normalizedWalletAddress = walletAddress.toLowerCase();

    allUsersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      const normalizedUserWalletAddress = userData.walletAddress.toLowerCase();
      console.log("Checking", normalizedUserWalletAddress);

      // Only push matching profiles
      if (normalizedUserWalletAddress === normalizedWalletAddress) {
        const user = {
          name: userData.name,
          email: userData.email,
          walletAddress: userData.walletAddress,
          projectsCompleted: userData.projectsCompleted || 0,  // Correct projectsCompleted field
          description: userData.description,
          githubLink: userData.githubLink,
          linkedinLink: userData.linkedinLink,
        };

        console.log("User data:", user);
        allData.push(user);
        console.log("All users data:", allData);
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
  return allData;
};


function FreelancerItem({ client, freelancer, projectId, handleSelectFreelancer, isLoading }) {
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const allData = await fetchUserProfile(client);
        console.log("Fetched profiles for client:", allData);

        const exactFreelancer = allData.find(
          (profile) => profile.walletAddress.toLowerCase() === freelancer.toLowerCase()
        );

        if (exactFreelancer) {
          setFreelancerProfile(exactFreelancer);
        } else {
          setFreelancerProfile(null);
        }
      } catch (error) {
        console.error(`Error fetching profile for client ${client}:`, error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [client, freelancer]);

  return (
    <div className="freelancer-item">
      <div className="freelancer-header">
        <h4>{freelancerProfile?.name || "Unknown Freelancer"}</h4>
        <span>Wallet: {freelancerProfile?.walletAddress || "N/A"}</span>
      </div>

      <div className="freelancer-details">
        <div>
          <strong>Projects Completed:</strong> {freelancerProfile?.projectsCompleted || 0}
        </div>
        <div>
          <strong>Description:</strong> {freelancerProfile?.description || "N/A"}
        </div>
        <div>
          <strong>Github:</strong>
          {freelancerProfile?.githubLink ? (
            <a href={freelancerProfile.githubLink} target="_blank" rel="noopener noreferrer">
              View
            </a>
          ) : (
            "N/A"
          )}
        </div>
        <div>
          <strong>LinkedIn:</strong>
          {freelancerProfile?.linkedinLink ? (
            <a href={freelancerProfile.linkedinLink} target="_blank" rel="noopener noreferrer">
              View
            </a>
          ) : (
            "N/A"
          )}
        </div>
      </div>

      <button
        className="select-freelancer-button"
        onClick={() => handleSelectFreelancer(projectId, freelancerProfile?.walletAddress)}
        disabled={isLoading}
      >
        Select Freelancer
      </button>
    </div>
  );
}

export default FreelancerItem;

import React, { useState, useEffect } from "react";
import { db } from "../../firebase.jsx";
import { contractAddress } from "../../contract/contractAddress";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
// import {ProjectsPage} from "./yourprojects";

const fetchUserProfile = async (walletAddress) => {
  // datastrucutre for all users data
  var allData = [];

  try {
    console.log("INSIDE FETCH USER PROFILE");
    const allUsersData = await collection(db, "profiles");
    const allUsersSnapshot = await getDocs(allUsersData);
    // console.log(allUsersSnapshot.docs.map(doc => doc.data()));
    console.log("Searching for wallet address:", walletAddress);
    const normalizedWalletAddress = walletAddress.toLowerCase();

     // Iterate over the documents
    allUsersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();

      // Normalize the wallet address from the database for comparison
      const normalizedUserWalletAddress = userData.walletAddress.toLowerCase();

      console.log("Checking", normalizedUserWalletAddress);
      // Check if it matches
      if (normalizedUserWalletAddress === normalizedWalletAddress) {
        console.log("Match found:", userData);
        
      } else {
        console.log(userData.walletAddress, "does not match", walletAddress);
        // update the user data
        var user = {
          name: userData.name,
          email: userData.email,
          walletAddress: userData.walletAddress,
          projectsCompleted: 0,
          description: userData.description,
          githubLink: userData.githubLink,
          linkedinLink : userData.linkedinLink
        }

        console.log("User data:", user);

        // add to all users data
        allData.push(user);

        console.log("All users data:", allData);
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
  return allData;
};

function FreelancerItem({
  client,
  freelancer,
  projectId,
  handleSelectFreelancer,
  isLoading,
}) {
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Fetch all profiles related to the client
        const allData = await fetchUserProfile(client);
        console.log("Fetched profiles for client:", allData);

        // Find the exact freelancer in the fetched profiles
        const exactFreelancer = allData.find(
          (profile) => profile.walletAddress.toLowerCase() === freelancer.toLowerCase()
        );

        if (exactFreelancer) {
          setFreelancerProfile(exactFreelancer); // Set the found freelancer profile
        } else {
          setFreelancerProfile(null); // No matching freelancer found
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
      {isProfileLoading ? (
        <div>Loading profile...</div>
      ) : freelancerProfile ? (
        <div>
          <div>Wallet: {freelancerProfile.walletAddress}</div>
          <div>Name: {freelancerProfile.name || "N/A"}</div>
          <div>Projects Completed: {freelancerProfile.projectsCompleted || 0}</div>
          <div>Description: {freelancerProfile.description || "N/A"}</div>
          <div>Github: {freelancerProfile.githubLink || "N/A"}</div>
          <div>LinkedIn: {freelancerProfile.linkedinLink || "N/A"}</div>
          <button
            className="select-freelancer-button"
            onClick={() => handleSelectFreelancer(projectId, freelancerProfile.walletAddress)}
            disabled={isLoading}
          >
            Select Freelancer
          </button>
        </div>
      ) : (
        <div>
          <div>Wallet: {freelancer}</div>
          <div>Profile not found</div>
        </div>
      )}
    </div>
  );
}

export default FreelancerItem;

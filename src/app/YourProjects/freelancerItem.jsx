import React, { useState, useEffect } from "react";
import { db } from "../../firebase.jsx";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

async function fetchUserProfile(walletAddress) {
  try {
    const docRef = doc(db, "profiles", walletAddress.toLowerCase());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      return [{
        name: userData.name || "Unknown Freelancer",
        email: userData.email || "N/A",
        walletAddress: userData.walletAddress || walletAddress,
        projectsCompleted: userData.projectsCompleted || 0,
        description: userData.description || "N/A",
        githubLink: userData.githubLink || "N/A",
        linkedinLink: userData.linkedinLink || "N/A",
      }];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return [];
  }
}



function FreelancerItem({ client, freelancer, projectId, handleSelectFreelancer, isLoading }) {
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Fetch the freelancer's profile, not the client's
        const allData = await fetchUserProfile(freelancer);
        console.log("Fetched profiles for freelancer:", allData);

        // Since fetchUserProfile returns an array, 
        // and you're using the freelancer's address directly,
        // ensure that the function returns an array with the matching profile or empty.
        // If you adapt fetchUserProfile to return a single doc, this simplifies further.
        
        if (allData.length > 0) {
          const exactFreelancer = allData[0]; // Assuming fetchUserProfile returns only one match if walletAddress is unique.
          setFreelancerProfile(exactFreelancer);
        } else {
          setFreelancerProfile(null);
        }
      } catch (error) {
        console.error(`Error fetching profile for freelancer ${freelancer}:`, error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [client, freelancer]);

  return (
    <div className="freelancer-item">
      {isProfileLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="freelancer-header">
            <h4>{freelancerProfile?.name || "Unknown Freelancer"}</h4>
            <span>Wallet: {freelancerProfile?.walletAddress || "N/A"}</span>
          </div>

          <div className="freelancer-details">
            {/* <div>
              <strong>Projects Completed:</strong> {freelancerProfile?.projectsCompleted || 0}
            </div> */}
            <div className="description-freelancer">
              <strong>Description:</strong> {freelancerProfile?.description || "N/A"}
              </div>
              <br/>
            <div className="other-freelancer-details">
              <div>
                <strong>Github: </strong>
                {freelancerProfile?.githubLink ? (
                  <a href={freelancerProfile.githubLink} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                ) : (
                  "N/A"
                )}
              </div>
              <div>
                <strong>LinkedIn: </strong>
                {freelancerProfile?.linkedinLink ? (
                  <a href={freelancerProfile.linkedinLink} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                ) : (
                  "N/A"
                )}
              </div>
            </div>
          </div>

          <button
            className="select-freelancer-button"
            onClick={() => handleSelectFreelancer(projectId, freelancerProfile?.walletAddress)}
            disabled={isLoading || !freelancerProfile?.walletAddress}
          >
            Select Freelancer
          </button>
        </>
      )}
    </div>
  );
}

export default FreelancerItem;

import React, { useState, useEffect } from "react";
import "./listing.css";
import { ethers } from "ethers";
import ProjectManagerABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";
import { db } from "../../firebase.jsx";
import { doc, getDoc } from "firebase/firestore";

function ProjectCard({ 
  projectId, 
  title, 
  description, 
  projectFee, 
  creator,
  onProjectAccepted 
}) {
  const [creatorProfilePic, setCreatorProfilePic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch creator's profile picture from Firestore
  useEffect(() => {
    const fetchCreatorProfilePic = async () => {
      try {
        const docRef = doc(db, "profiles", creator.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setCreatorProfilePic(
            profileData.profilePicture || process.env.PUBLIC_URL + '/asset/company_logo.jpg'
          );
        } else {
          setCreatorProfilePic(process.env.PUBLIC_URL + '/asset/company_logo.jpg');
        }
      } catch (error) {
        console.error("Error fetching creator profile:", error);
        setCreatorProfilePic(process.env.PUBLIC_URL + '/asset/company_logo.jpg');
      }
    };

    fetchCreatorProfilePic();
  }, [creator]);

  const handleAcceptProject = async (e) => {
    e.stopPropagation(); 
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      setIsLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ProjectManagerABI, signer);

      const currentAddress = await signer.getAddress();
      if (currentAddress.toLowerCase() === creator.toLowerCase()) {
        alert("You cannot accept your own project.");
        return;
      }

      const verificationFee = ethers.parseEther("0.0003");

      const tx = await contract.acceptProject(projectId, { value: verificationFee });
      await tx.wait();

      alert("Project accepted successfully!");
      
      if (onProjectAccepted) {
        onProjectAccepted(projectId);
      }
    } catch (error) {
      console.error("Error accepting project:", error);
      alert("Error accepting project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="project-card" onClick={() => setIsModalOpen(true)}>
        <img
          src={creatorProfilePic}
          alt="Project Creator"
          className="project-logo"
        />
        <h2 className="project-title">{title}</h2>
        <p className="project-description">
          {description.length > 100 
            ? `${description.substring(0, 100)}...`
            : description
          }
        </p>
        <div>
          <span className="project-stipend">Project Fee: {projectFee} ETH</span>
        </div>
        <br />
        <div className="button-gradient-wrapper">
          <div className="button-inner-wrapper">
            <button 
              className="gradient-button" 
              onClick={handleAcceptProject}
              disabled={isLoading}
            >
              {isLoading ? "Accepting..." : "Accept Project"}
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={creatorProfilePic}
              alt="Project Creator"
              className="modal-project-logo"
            />
            <h2 className="modal-project-title">{title}</h2>
            <p className="modal-project-description">{description}</p>
            <div className="modal-project-details">
              <span className="modal-project-stipend">
                Project Fee: {projectFee} ETH
              </span>
            </div>
            <button 
              className="close-modal-button" 
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectCard;

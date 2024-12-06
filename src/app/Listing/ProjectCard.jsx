import React, { useState, useEffect } from "react";
import "./listing.css";
import { ethers } from "ethers";
import ProjectManagerABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";

function ProjectCard({ 
  projectId, 
  title, 
  description, 
  projectFee, 
  creator,
  onProjectAccepted 
}) {
  const [potentialFreelancers, setPotentialFreelancers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAcceptProject = async () => {
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
        alert("You cannot accept your own project");
        return;
      }

      const verificationFee = ethers.parseEther("0.0003");

      const tx = await contract.acceptProject(projectId, { value: verificationFee });
      await tx.wait();

      alert("Project accepted successfully!");
      
      // Optionally refresh potential freelancers or update parent component
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
    <div className="project-card">
      <img
        src={process.env.PUBLIC_URL + '/asset/company_logo.jpg'}
        alt="Project Logo"
        className="project-logo"
      />
      <h2 className="project-title">{title}</h2>
      <p className="project-description">{description}</p>
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
  );
}

export default ProjectCard;
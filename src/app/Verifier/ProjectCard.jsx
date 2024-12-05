import React, { useState, useEffect } from "react";
import "./verifier.css";
import { parseUnits, ethers } from "ethers";
import ProjectManagerABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";

function VerifierProjectCard({ projectId, title, description, projectFee, creator, freelancer }) {
  const [isVoting, setIsVoting] = useState(false);
  const [verificationFee, setVerificationFee] = useState(null);

  useEffect(() => {
    const fetchVerificationFee = async () => {
      try {
        if (!window.ethereum) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, ProjectManagerABI, provider);
        
        const fee = await contract.verificationFee();
        setVerificationFee(fee);
      } catch (error) {
        console.error("Error fetching verification fee:", error);
      }
    };

    fetchVerificationFee();
  }, []);

  const handleVote = async (accept) => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ProjectManagerABI, signer);

      const currentAddress = await signer.getAddress();
      if (currentAddress.toLowerCase() === creator.toLowerCase() || 
          currentAddress.toLowerCase() === freelancer.toLowerCase()) {
        alert("You cannot verify a project for your own project");
        return;
      }

      setIsVoting(true);
      
      try {
        const tx = await contract.verifyProjectCompletion(projectId, accept, {
          value: verificationFee  // Use the exact verification fee from the contract
        });
        await tx.wait();
        
        alert(accept ? "Project vote submitted to ACCEPT" : "Project vote submitted to REJECT");
      } catch (error) {
        console.error("Transaction error:", error);
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert("Error voting. Please try again.");
    } finally {
      setIsVoting(false);
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
        <span className="project-stipend">
        Verification Fee: {verificationFee 
          ? ethers.formatUnits(verificationFee, 18) 
          : 'Loading...'} ETH
      </span>
        <br />
        <span>Creator: {creator.slice(0, 6)}...{creator.slice(-4)}</span>
        <br />
        <span>Freelancer: {freelancer.slice(0, 6)}...{freelancer.slice(-4)}</span>
      </div>
      <br />
      <div className="button-container">
        <div className="button-gradient-wrapper">
          <button 
            className="gradient-button accept" 
            onClick={() => handleVote(true)} 
            disabled={isVoting}
          >
            {isVoting ? 'Processing...' : 'Accept Project'}
          </button>
        </div>
        <div className="button-gradient-wrapper">
          <button 
            className="gradient-button reject" 
            onClick={() => handleVote(false)} 
            disabled={isVoting}
          >
            {isVoting ? 'Processing...' : 'Reject Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifierProjectCard;
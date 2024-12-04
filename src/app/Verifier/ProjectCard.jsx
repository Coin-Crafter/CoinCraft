import React , {useState} from "react";
import "./verifier.css"; // Import styles
import { ethers } from "ethers";
import ProjectManagerABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";

function VerifierProjectCard({ projectId, title, description, projectFee, creator, freelancer }) {
  const [isResolving, setIsResolving] = useState(false);

  const handleResolveDispute = async () => {
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
        alert("You cannot resolve a dispute for your own project");
        return;
      }

      setIsResolving(true);
      const userChoice = window.confirm("Do you want to accept the project completion? \n\nClick 'OK' to ACCEPT or 'Cancel' to REJECT.");
      
      try {
        if (userChoice) {
          // Call verifyProjectCompletion to accept
          const tx = await contract.verifyProjectCompletion(projectId);
          await tx.wait();
          alert("Project successfully marked as completed!");
        } else {
          // Call rejectProjectCompletion to reject
          const tx = await contract.rejectProjectCompletion(projectId);
          await tx.wait();
          alert("Project has been reopened and freelancer removed.");
        }
      } catch (error) {
        console.error("Transaction error:", error);
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error resolving dispute:", error);
      alert("Error resolving dispute. Please try again.");
    } finally {
      setIsResolving(false);
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
        <span className="project-stipend">Verification Fee: {(projectFee / 3).toFixed(4)} ETH</span>
        <br />
        <span>Creator: {creator.slice(0, 6)}...{creator.slice(-4)}</span>
        <br />
        <span>Freelancer: {freelancer.slice(0, 6)}...{freelancer.slice(-4)}</span>
      </div>
      <br />
      <div className="button-gradient-wrapper">
        <div className="button-inner-wrapper">
          <button className="gradient-button" onClick={handleResolveDispute} disabled={isResolving}>
            {isResolving ? 'Processing...' : 'Resolve Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifierProjectCard;
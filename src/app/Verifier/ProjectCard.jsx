import React, { useState, useEffect } from "react";
import "./verifier.css";
import { parseUnits, ethers } from "ethers";
import ProjectManagerABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";
import { db } from "../../firebase.jsx";
import { doc, getDoc } from "firebase/firestore";

function VerifierProjectCard({ projectId, title, description, projectFee, creator, freelancer, proofLink }) {
  const [isVoting, setIsVoting] = useState(false);
  const [verificationFee, setVerificationFee] = useState(null);
  const [creatorProfilePic, setCreatorProfilePic] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    const fetchCreatorProfilePic = async () => {
      try {
        const docRef = doc(db, "profiles", creator.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setCreatorProfilePic(profileData.profilePicture || process.env.PUBLIC_URL + '/asset/company_logo.jpg');
        } else {
          console.warn("Creator profile not found.");
          setCreatorProfilePic(process.env.PUBLIC_URL + '/asset/company_logo.jpg');
        }
      } catch (error) {
        console.error("Error fetching creator profile:", error);
        setCreatorProfilePic(process.env.PUBLIC_URL + '/asset/company_logo.jpg');
      }
    };

    fetchVerificationFee();
    fetchCreatorProfilePic();
  }, [creator]);

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
        alert("You cannot verify a project for your own project.");
        return;
      }

      setIsVoting(true);
      
      try {
        const tx = await contract.verifyProjectCompletion(projectId, accept, {
          value: verificationFee,
        });
        await tx.wait();
        
        alert(accept ? "Project vote submitted to ACCEPT" : "Project vote submitted to REJECT");
      } catch (error) {
        console.error("Transaction error:", error);
        alert(`Error: ${error.message}`);
        setIsVoting(false);
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert("Error voting. Please try again.");
      setIsVoting(false);
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
    <div className="project-card" onClick={toggleModal}>
      <img
        src={creatorProfilePic}
        alt="Project Creator"
        className="project-logo"
      />
      <h2 className="project-title">{title}</h2>
      <p className="project-description">
          {description.length > 100 ? `${description.substring(0, 100)}...` : description}
      </p>
      <div>
        <span className="project-stipend">
          Verification Fee: {verificationFee 
            ? ethers.formatUnits(verificationFee, 18) 
            : 'Loading...'} ETH
        </span>
        
        <span className="modal-prooflink">
          Proof: <a 
            href={proofLink.startsWith("http://") || proofLink.startsWith("https://") ? proofLink : `https://${proofLink}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {proofLink}
          </a>
        </span>
      </div>

      {/* Conditionally render buttons based on voting state */}
      {!isVoting ? (
        <div className="button-container2">
          <div className="button-gradient-wrapper verifier">
            <button 
              className="gradient-button accept" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent modal from opening
                handleVote(true);
              }} 
            >
              Accept
            </button>
          </div>
          <div className="button-gradient-wrapper">
            <button 
              className="gradient-button reject" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent modal from opening
                handleVote(false);
              }} 
            >
              Reject
            </button>
          </div>
        </div>
      ) : (
        <div className="button-container2 processing-state">
          <button 
            className="gradient-button processing" 
            disabled
          >
            Processing Vote...
          </button>
        </div>
      )}
    </div>
    {/* Rest of the modal code remains the same */}
    {isModalOpen && (
      <div className="modal-overlay" onClick={toggleModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <img
            src={creatorProfilePic}
            alt="Project Creator"
            className="modal-project-logo"
          />
          <h2 className="project-title">{title}</h2>
          <p className="modal-project-description">{description}</p>
          <div>
            <span className="project-stipend">
              Verification Fee: {verificationFee 
                ? ethers.formatUnits(verificationFee, 18) 
                : 'Loading...'} ETH
            </span>
            <br />
            
            <span className="modal-prooflink">
              Proof: <a 
                href={proofLink.startsWith("http://") || proofLink.startsWith("https://") ? proofLink : `https://${proofLink}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {proofLink}
              </a>
            </span>
          </div>
          <br></br>
          <button className="close-modal-button" onClick={toggleModal}>
            Close
          </button>
        </div>
      </div>
    )}
    </>
  );
}

export default VerifierProjectCard;
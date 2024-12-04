import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ProjectCard from "./ProjectCard"; // Import card component
import "./verifier.css"; // Import styles
import ProjectManagerABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";

function Verify() {
  const [projects, setProjects] = useState([]);
  const [verificationFee, setVerificationFee] = useState("0");
  const [loading, setLoading] = useState(true);

  const abi = ProjectManagerABI;

  useEffect(() => {
    const fetchDisputedProjects = async () => {
      try {
        setLoading(true);

        // Connect to the Ethereum provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Get contract instance
        const contract = new ethers.Contract(contractAddress, abi, signer);

        // Fetch verification fee
        const fee = await contract.verificationFee();
        setVerificationFee(ethers.formatUnits(fee, "ether"));

        // Fetch projects with status "InDispute"
        const statusInDispute = 3n; // Enum value for "InDispute"
        const disputedProjects = await contract.getProjectsByStatus(statusInDispute);

        // Map raw data into a readable format
        const formattedProjects = disputedProjects.map((project) => ({
          id: Number(project.id),
          title: project.name,
          description: project.description,
          projectFee: ethers.formatUnits(project.projectFee || "0", "ether"),
          creator: project.creator,
          freelancer: project.freelancer
        }));

        setProjects(formattedProjects);
      } catch (error) {
        console.error("Error fetching disputed projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputedProjects();
  }, [abi]);

  return (
    <div className="listing-page">
      <div className="listing-header">
        <h1>Join as a Verifier?</h1>
        {/* <p>Verification Fee: {verificationFee} ETH</p> */}
      </div>
      <div className="project-grid">
        {loading ? (
          <p>Loading disputed projects...</p>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              projectId={project.id}
              title={project.title}
              description={project.description}
              projectFee={verificationFee} // Use verification fee instead of project fee
              creator={project.creator}
              freelancer={project.freelancer}
            />
          ))
        ) : (
          <p>No projects are currently in dispute.</p>
        )}
      </div>
    </div>
  );
}

export default Verify;
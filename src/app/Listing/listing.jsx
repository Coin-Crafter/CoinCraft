import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ProjectCard from "./ProjectCard"; // Import card component
import "./listing.css"; // Import styles
import ProjectManagerABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";

function Listing() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const abi = ProjectManagerABI;

  useEffect(() => {
    const fetchOpenProjects = async () => {
      try {
        setLoading(true);

        // Connect to the Ethereum provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Get contract instance
        const contract = new ethers.Contract(contractAddress, abi, signer);

        // Fetch projects with status "Open"
        const statusOpen = 0n; // Enum value for "Open"
        const openProjects = await contract.getProjectsByStatus(statusOpen);

        // Map raw data into a readable format
        const formattedProjects = openProjects.map((project) => ({
          id: Number(project.id),
          title: project.name,
          description: project.description,
          projectFee: ethers.formatUnits(project.projectFee || "0", "ether"),
          creator: project.creator,
        }));

        setProjects(formattedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpenProjects();
  }, [abi]);

  return (
    <div className="listing-page">
      <div className="listing-header">
        <h1>Open Projects</h1>
      </div>
      <div className="project-grid">
        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              projectId={project.id}
              title={project.title}
              description={project.description}
              projectFee={project.projectFee}
              creator={project.creator}
            />
          ))
        ) : (
          <p>No open projects available.</p>
        )}
      </div>
    </div>
  );
}

export default Listing;

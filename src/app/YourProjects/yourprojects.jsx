import React, { useState, useEffect } from "react";
import "./yourprojects.css";
import { BrowserProvider, Contract } from "ethers";
import contractABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";
import { ethers } from "ethers";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [clientProjects, setClientProjects] = useState([]);
  const [freelancerProjects, setFreelancerProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const VERIFICATION_FEE = "0.0005";


  // Load projects from the blockchain
  // const loadProjects = async () => {
  //   try {
  //     if (!window.ethereum) {
  //       alert("MetaMask is not installed!");
  //       return;
  //     }

  //     const provider = new BrowserProvider(window.ethereum);
  //     const signer = await provider.getSigner();
  //     const contract = new Contract(contractAddress, contractABI, signer);

  //     const walletAddress = await signer.getAddress();
  //     const blockchainProjects = await contract.getProjectsByAddress(
  //       walletAddress
  //     );

  //     const loadedProjects = blockchainProjects.map((project, index) => ({
  //       id: index + 1,
  //       title: project.name,
  //       description: project.description,
  //       status: "Open", // Default status for demonstration
  //       expanded: false,
  //     }));

  //     setClientProjects(loadedProjects);
  //   } catch (error) {
  //     console.error("Error loading projects:", error);
  //   }
  // };

  const loadProjects = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }
  
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);
  
      const walletAddress = await signer.getAddress();
      const blockchainProjects = await contract.getProjectsByAddress(
        walletAddress
      );
  
      console.log('Loaded Blockchain Projects:', blockchainProjects);
  
      const loadedProjects = blockchainProjects.map((project, index) => ({
        id: index + 1, // or potentially just `index` depending on how you want to track IDs
        title: project.name,
        description: project.description,
        status: "Open",
        expanded: false,
        projectFee: ethers.formatEther(project.projectFee),
        isTransferred: project.isTransferred,
        freelancerAddress: project.freelancer // Add this line
      }));
  
      setClientProjects(loadedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const toggleExpand = (id) => {
    const updateProjects = (prevProjects) =>
      prevProjects.map((project) =>
        project.id === id
          ? { ...project, expanded: !project.expanded }
          : project
      );

    if (activeTab === "client") {
      setClientProjects(updateProjects(clientProjects));
    } else {
      setFreelancerProjects(updateProjects(freelancerProjects));
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.description || !formData.projectFee) {
      alert("Please fill in all fields, including the project fee.");
      return;
    }
  
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }
  
      setIsLoading(true);
  
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);
  
      const projectFeeInWei = ethers.parseEther(formData.projectFee);
      const timestamp = Math.floor(Date.now() / 1000);
  
      // Create a project without locking fees
      const tx = await contract.createProject(
        formData.name,
        formData.description,
        timestamp,
        projectFeeInWei
      );
  
      await tx.wait();
  
      alert("Project created successfully! Funds can be transferred later.");
      loadProjects(); // Refresh projects
  
      setFormData({ name: "", description: "", projectFee: "" });
      setShowModal(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project. Please try again.");
      setIsLoading(false);
    }
  };  

  // const handleTransferFunds = async (projectId, freelancerAddress, projectFee, verificationFee) => {
  //   try {
  //     if (!window.ethereum) {
  //       alert("MetaMask is not installed!");
  //       return;
  //     }
  
  //     const provider = new BrowserProvider(window.ethereum);
  //     const signer = await provider.getSigner();
  //     const contract = new Contract(contractAddress, contractABI, signer);
  
  //     const totalFee = ethers.parseEther(
  //       (parseFloat(projectFee) + parseFloat(verificationFee)).toString()
  //     );
  
  //     // Transfer funds to the freelancer
  //     const tx = await contract.transferFunds(projectId, freelancerAddress, {
  //       value: totalFee,
  //     });
  
  //     await tx.wait();
  
  //     alert("Funds transferred successfully!");
  //     loadProjects(); // Refresh projects
  //   } catch (error) {
  //     console.error("Error transferring funds:", error);
  //     alert("Error transferring funds. Please try again.");
  //   }
  // };
  
  const handleTransferFunds = async (projectId, freelancerAddress, projectFee, verificationFee) => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }
  
      console.log('Transfer Details:', {
        projectId, 
        freelancerAddress, 
        projectFee, 
        verificationFee
      });
  
      // Validate inputs
      if (projectId == null || !freelancerAddress) {
        alert("Invalid project ID or freelancer address.");
        return;
      }
  
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);
  
      // Fetch all projects for the current user to verify the project exists
      const walletAddress = await signer.getAddress();
      const userProjects = await contract.getProjectsByAddress(walletAddress);
  
      console.log('User Projects:', userProjects);
      console.log('Attempting to transfer project with ID:', projectId);
  
      // Verify the project exists in the user's projects
      const projectExists = userProjects.length > projectId;
      if (!projectExists) {
        alert(`Project with ID ${projectId} does not exist for this user.`);
        return;
      }
  
      // Convert to string and parse explicitly
      const projectFeeStr = String(projectFee);
      const verificationFeeStr = String(verificationFee);
  
      const totalFee = ethers.parseEther(
        (parseFloat(projectFeeStr) + parseFloat(verificationFeeStr)).toString()
      );
  
      // Transfer funds to the freelancer
      const tx = await contract.transferFunds(projectId, freelancerAddress, {
        value: totalFee,
      });
  
      await tx.wait();
  
      alert("Funds transferred successfully!");
      loadProjects(); // Refresh projects
    } catch (error) {
      console.error("Full error details:", error);
      alert(`Error transferring funds: ${error.message}`);
    }
  };
  
  const renderProjectStatus = (status) => {
    switch (status) {
      case "Open":
        return <span className="status open">Open</span>;
      case "In Progress":
        return <span className="status in-progress">In Progress</span>;
      case "Dispute":
        return <span className="status dispute">Dispute</span>;
      case "Completed":
        return <span className="status completed">Completed</span>;
      default:
        return <span className="status unknown">Unknown</span>;
    }
  };

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1>Your Projects</h1>
        <p>View and manage your ongoing projects as a Client or Freelancer.</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "client" ? "active" : ""}`}
          onClick={() => setActiveTab("client")}
        >
          As a Client
        </button>
        <button
          className={`tab ${activeTab === "freelancer" ? "active" : ""}`}
          onClick={() => setActiveTab("freelancer")}
        >
          As a Freelancer
        </button>
      </div>

      {activeTab === "client" && (
        <div>
          <button className="create-button" onClick={() => setShowModal(true)}>
            + Create a New Project
          </button>
        </div>
      )}

      {/* Project List */}
      <div className="yprojects-list">
        {(activeTab === "client" ? clientProjects : freelancerProjects).map(
          (project) => (
            <div
              key={project.id}
              className={`yprojects-card ${
                project.expanded ? "expanded-card" : ""
              }`}
            >
              <div
                className="yprojects-header"
                onClick={() => toggleExpand(project.id)}
              >
                <h3>{project.title}</h3>
                <button className="yexpand-button">
                  <span className="material-icons">
                    {project.expanded ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
              {project.expanded && (
                <div className="yprojects-details">
                  <p>{project.description}</p>
                  <p>
                    Status:{" "}
                    {project.isTransferred ? "Completed" : "Pending Transfer"}
                  </p>

                  {/* Transfer Funds Section */}
                  {!project.isTransferred && (
                    <div>
                      <input
                        type="text"
                        placeholder="Enter Freelancer Address"
                        value={project.freelancerAddress || ""}
                        onChange={(e) =>
                          setClientProjects((prevProjects) =>
                            prevProjects.map((p) =>
                              p.id === project.id
                                ? { ...p, freelancerAddress: e.target.value }
                                : p
                            )
                          )
                        }
                      />
                      <button
                        className="transfer-funds-button"
                        onClick={() => {
                          // Log the exact project details before transfer
                          console.log('Project details for transfer:', {
                            projectId: project.id - 1, // Adjust index if needed
                            freelancerAddress: project.freelancerAddress,
                            projectFee: project.projectFee,
                            verificationFee: VERIFICATION_FEE
                          });

                          handleTransferFunds(
                            project.id - 1, // Adjust index to match contract's zero-based indexing
                            project.freelancerAddress,
                            project.projectFee,
                            VERIFICATION_FEE
                          );
                        }}
                        disabled={!project.freelancerAddress}
                      >
                        Transfer Funds
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Project</h2>

            <input
              type="text"
              name="name"
              placeholder="Project Name"
              value={formData.name}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="projectFee"
              placeholder="Project Fee (ETH)"
              value={formData.projectFee || ""}
              onChange={handleInputChange}
            />

            <textarea
              name="description"
              placeholder="Project Description"
              value={formData.description}
              onChange={handleInputChange}
            />

            <div>
              <p>Verification Fee: {VERIFICATION_FEE} ETH</p>
            </div>

            <div className="modal-buttons">
              <button onClick={handleCreateProject} disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;

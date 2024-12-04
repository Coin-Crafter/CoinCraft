import React, { useState, useEffect } from "react";
import "./yourprojects.css";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import contractABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [clientProjects, setClientProjects] = useState([]);
  const [freelancerProjects, setFreelancerProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", projectFee: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Load projects from the blockchain
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

      if (activeTab === "client") {
        const blockchainProjects = await contract.getProjectsByAddress(walletAddress);

        const loadedProjects = blockchainProjects.map((project) => ({
          id: Number(project.id),
          title: project.name,
          description: project.description,
          status: getStatusString(project.status),
          projectFee: formatEther(project.projectFee),
          expanded: false,
        }));

        setClientProjects(loadedProjects);
      } else if (activeTab === "freelancer") {
        const blockchainProjects = await contract.getProjectsForFreelancer(walletAddress);

        const loadedProjects = blockchainProjects.map((project) => ({
          id: Number(project.id),
          title: project.name,
          description: project.description,
          status: getStatusString(project.status),
          projectFee: formatEther(project.projectFee),
          expanded: false,
        }));

        setFreelancerProjects(loadedProjects);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [activeTab]);

  const toggleExpand = (id) => {
    const updateProjects = (prevProjects) =>
      prevProjects.map((project) =>
        project.id === id ? { ...project, expanded: !project.expanded } : project
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

  const handleMarkProjectCompleted = async (projectId) => {
    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const tx = await contract.markProjectAsCompleted(projectId);
      await tx.wait();

      alert("Project marked as completed and waiting for client approval!");
      await loadProjects();
    } catch (error) {
      console.error("Error marking project as completed:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveProjectCompletion = async (projectId) => {
    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const tx = await contract.approveProjectCompletion(projectId);
      await tx.wait();

      alert("Project completion approved!");
      await loadProjects();
    } catch (error) {
      console.error("Error approving project completion:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisputeProjectCompletion = async (projectId) => {
    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const tx = await contract.disputeProjectCompletion(projectId);
      await tx.wait();

      alert("Project completion disputed and sent to verification!");
      await loadProjects();
    } catch (error) {
      console.error("Error disputing project completion:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveProject = async (projectId) => {
    if (projectId === undefined || projectId === null) {
      alert("Invalid project identifier");
      return;
    }

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed!");
      }

      setIsLoading(true);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const tx = await contract.removeProject(projectId);
      await tx.wait();

      alert("Project removed successfully!");

      await loadProjects();
    } catch (error) {
      console.error("Error removing project:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.description || !formData.projectFee) {
      alert("Please fill in all fields");
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

      const timestamp = Math.floor(Date.now() / 1000);
      const verificationFee = parseEther("0.0003");
      const projectFee = parseEther(formData.projectFee);

      const totalFee = projectFee + verificationFee;

      const tx = await contract.createProject(
        formData.name,
        formData.description,
        timestamp,
        projectFee,
        { value: totalFee }
      );

      await tx.wait();

      alert("Project created successfully!");
      loadProjects();
      setFormData({ name: "", description: "", projectFee: "" });
      setShowModal(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project. Please try again.");
      setIsLoading(false);
    }
  };

  function getStatusString(statusCode) {
    switch (statusCode) {
      case 0n:
        return "Open";
      case 1n:
        return "In Progress";
      case 2n:
        return "Waiting For Approval";
      case 3n:
        return "In Dispute";
      case 4n:
        return "Completed";
      default:
        return "Unknown";
    }
  }

  const renderProjectStatus = (status) => {
    switch (status) {
      case "Open":
        return <span className="status open">Open</span>;
      case "In Progress":
        return <span className="status in-progress">In Progress</span>;
      case "Waiting For Approval":
        return <span className="status waiting">Waiting for Approval</span>;
      case "In Dispute":
        return <span className="status dispute">In Dispute</span>;
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

      <div className="yprojects-list">
        {(activeTab === "client" ? clientProjects : freelancerProjects).map((project) => (
          <div
            key={project.id}
            className={`yprojects-card ${project.expanded ? "expanded-card" : ""}`}
          >
            <div className="yprojects-header" onClick={() => toggleExpand(project.id)}>
              <h3>{project.title}</h3>
              <div className="right-section">
                {renderProjectStatus(project.status)}
                <button className="yexpand-button">
                  <span className="material-icons">
                    {project.expanded ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
            </div>
            {project.expanded && (
              <div className="yprojects-details">
                <p>{project.description}</p>
                {/* Freelancer: Mark Project as Completed */}
                {activeTab === "freelancer" && 
                 project.status === "In Progress" && (
                  <button 
                    className="mark-completed-button" 
                    onClick={() => handleMarkProjectCompleted(project.id)}
                    disabled={isLoading}
                  >
                    Mark Project Completed
                  </button>
                )}

                {/* Client: Approve or Dispute Project */}
                {activeTab === "client" && 
                 project.status === "Waiting For Approval" && (
                  <div className="project-approval-buttons">
                    <button 
                      className="approve-button" 
                      onClick={() => handleApproveProjectCompletion(project.id)}
                      disabled={isLoading}
                    >
                      Approve Completion
                    </button>
                    <button 
                      className="dispute-button" 
                      onClick={() => handleDisputeProjectCompletion(project.id)}
                      disabled={isLoading}
                    >
                      Dispute Completion
                    </button>
                  </div>
                )}

                
                {/* Only show the remove button for client projects */}
                {activeTab === "client" && project.status === "Open" && (
                  <button className="remove-project-button" onClick={() => handleRemoveProject(project.id)}>
                    Remove Project
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
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
            <textarea
              name="description"
              placeholder="Project Description"
              value={formData.description}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="projectFee"
              placeholder="Project Fee (in ETH)"
              value={formData.projectFee}
              onChange={handleInputChange}
            />
            <p>Verification fee: 0.0003 ETH</p>
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

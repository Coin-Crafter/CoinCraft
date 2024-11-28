import React, { useState, useEffect } from "react";
import "./yourprojects.css";
import { BrowserProvider, Contract } from "ethers";
import contractABI from "../../contract/contractABI.json";
import { contractAddress } from "../../contract/contractAddress";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [clientProjects, setClientProjects] = useState([]);
  const [freelancerProjects, setFreelancerProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
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

      // Get the connected wallet address
      const walletAddress = await signer.getAddress();

      // Fetch projects for this wallet address
      const blockchainProjects = await contract.getProjectsByAddress(walletAddress);

      // Map blockchain data to local state structure
      const loadedProjects = blockchainProjects.map((project, index) => ({
        id: index + 1,
        title: project.name,
        description: project.description,
        status: "In Progress",
        expanded: false,
      }));

      // Set state with loaded projects
      setClientProjects(loadedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  // Call loadProjects on component mount
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
    if (!formData.name || !formData.description) {
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

      const tx = await contract.createProject(
        formData.name,
        formData.description,
        timestamp
      );

      await tx.wait();

      alert("Project created successfully!");

      // Refresh the projects after adding a new one
      loadProjects();

      setFormData({ name: "", description: "" });
      setShowModal(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="projects-page">
      {/* Header Section */}
      <header className="projects-header">
        <h1>Your Projects</h1>
        <p>View and manage your ongoing projects as a Client or Freelancer.</p>
      </header>

      {/* Tabs Section */}
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

      {/* Create New Project Button */}
      {activeTab === "client" && (
        <div>
          <button className="create-button" onClick={() => setShowModal(true)}>
            + Create a New Project
          </button>
        </div>
      )}

      {/* Project List */}
      <div className="yprojects-list">
        {(activeTab === "client" ? clientProjects : freelancerProjects).map((project) => (
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
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
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

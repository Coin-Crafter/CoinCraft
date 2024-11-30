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

  const handleTransferFunds = async (projectId, freelancerAddress, projectFee, verificationFee) => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }
  
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);
  
      const totalFee = ethers.parseEther(
        (parseFloat(projectFee) + parseFloat(verificationFee)).toString()
      );
  
      // Transfer funds to the freelancer
      const tx = await contract.transferFunds(projectId, freelancerAddress, {
        value: totalFee,
      });
  
      await tx.wait();
  
      alert("Funds transferred successfully!");
      loadProjects(); // Refresh projects
    } catch (error) {
      console.error("Error transferring funds:", error);
      alert("Error transferring funds. Please try again.");
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
      {/* <div className="yprojects-list">
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
      </div> */}

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
                <p>Status: {project.isTransferred ? "Completed" : "Pending Transfer"}</p>

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
                      onClick={() =>
                        handleTransferFunds(
                          project.id,
                          project.freelancerAddress, // User-provided address
                          project.projectFee,
                          VERIFICATION_FEE
                        )
                      }
                      disabled={!project.freelancerAddress} // Disable if no address entered
                    >
                      Transfer Funds
                    </button>
                  </div>
                )}
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

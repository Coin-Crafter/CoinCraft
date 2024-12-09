import React, { useState, useEffect } from "react";
import "./yourprojects.css";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import contractABI from "../../contract/contractABI.json";
import { db } from "../../firebase.jsx";
import { contractAddress } from "../../contract/contractAddress";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import FreelancerItem from "./freelancerItem.jsx";

/* ------------------------- Utility Functions ------------------------- */

/**
 * Returns a human-readable project status string from the numeric code.
 */
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

/**
 * Renders a styled span representing the project status.
 */
function renderProjectStatus(status) {
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
}

/**
 * Fetches the user profile from Firestore if it exists.
 */
async function fetchUserProfile(walletAddress) {
  try {
    const allUsersData = await collection(db, "profiles");
    const allUsersSnapshot = await getDocs(allUsersData);
    const normalizedWalletAddress = walletAddress.toLowerCase();

    allUsersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      const normalizedUserWalletAddress = userData.walletAddress.toLowerCase();

      if (normalizedUserWalletAddress === normalizedWalletAddress) {
        console.log("Match found (User Profile):", userData);
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}

/**
 * Fetches the freelancer's name from Firestore.
 */
async function fetchFreelancerName(walletAddress) {
  if (!walletAddress || walletAddress === "0x0000000000000000000000000000000000000000") {
    return "";
  }

  try {
    const docRef = doc(db, "profiles", walletAddress.toLowerCase());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().name || "Unknown Freelancer";
    } else {
      return "Freelancer Not Found";
    }
  } catch (error) {
    console.error("Error fetching freelancer name:", error);
    return "Error Fetching Name";
  }
}

/**
 * Fetches the full freelancer profile from Firestore.
 */
async function fetchFreelancerProfile(walletAddress) {
  if (!walletAddress || walletAddress === "0x0000000000000000000000000000000000000000") {
    return {};
  }

  try {
    const docRef = doc(db, "profiles", walletAddress.toLowerCase());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        name: data.name || "Unknown Freelancer",
        projectsCompleted: data.projectsCompleted || 0,
        description: data.description || "No description provided",
        githubLink: data.githubLink || "",
        linkedinLink: data.linkedinLink || "",
      };
    } else {
      console.error("Freelancer profile not found:", walletAddress);
      return {};
    }
  } catch (error) {
    console.error("Error fetching freelancer profile:", error);
    return {};
  }
}


/* ------------------------- Main Component ------------------------- */

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [clientProjects, setClientProjects] = useState([]);
  const [freelancerProjects, setFreelancerProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", projectFee: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [proofLink, setProofLink] = useState("");
  const [contractInstance, setContractInstance] = useState(null);

  /* ------------------------- Effects ------------------------- */

  // Get wallet address and contract instance on mount
  useEffect(() => {
    const getWalletAddress = async () => {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);
      setContractInstance(contract);

      const wAddress = await signer.getAddress();
      setWalletAddress(wAddress);
    };
    getWalletAddress();
  }, []);

  // Load projects whenever the active tab changes
  useEffect(() => {
    loadProjects();
  }, [activeTab]);  

  /* ------------------------- Data Loading ------------------------- */

  const loadProjects = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const wAddress = await signer.getAddress();
      await fetchUserProfile(wAddress);

      if (activeTab === "client") {
        await loadClientProjects(contract, wAddress);
      } else if (activeTab === "freelancer") {
        await loadFreelancerProjects(contract, wAddress);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadClientProjects = async (contract, walletAddress) => {
    const blockchainProjects = await contract.getProjectsByAddress(walletAddress);
  
    const loadedProjects = await Promise.all(
      blockchainProjects.map(async (project) => {
        if (project.status >= 0n && project.status <= 4n) {
          const freelancers = project.potentialFreelancers || [];
  
          // Fetch freelancer profiles in parallel for better performance
          const freelancerProfiles = await Promise.all(
            freelancers.map(async (freelancerAddress) => {
              const profile = await fetchFreelancerProfile(freelancerAddress);
              return {
                address: freelancerAddress,
                ...profile,
              };
            })
          );
  
          return {
            id: Number(project.id),
            title: project.name,
            description: project.description,
            status: getStatusString(project.status),
            projectFee: formatEther(project.projectFee),
            proofLink: project.proofLink,
            expanded: false,
            potentialFreelancers: freelancerProfiles, // Assign complete profiles
            selectedFreelancer: {
              address: project.selectedFreelancer,
              ...(await fetchFreelancerProfile(project.selectedFreelancer)),
            },
          };
        }
        return null;
      })
    );
  
    setClientProjects(loadedProjects.filter((project) => project !== null));
  };
  

  const loadFreelancerProjects = async (contract, walletAddress) => {
    const allProjects = await contract.getProjectsByStatus(0n); // Open projects

    const loadedProjects = allProjects
      .filter((project) =>
        project.potentialFreelancers.some(
          (freelancer) => freelancer.toLowerCase() === walletAddress.toLowerCase()
        )
      )
      .map((project) => ({
        id: Number(project.id),
        title: project.name,
        description: project.description,
        status: getStatusString(project.status),
        projectFee: formatEther(project.projectFee),
        expanded: false,
      }));

    const freelancerProjectsData = await contract.getProjectsForFreelancer(walletAddress);
    const inProgressProjects = freelancerProjectsData.map((project) => ({
      id: Number(project.id),
      title: project.name,
      description: project.description,
      status: getStatusString(project.status),
      projectFee: formatEther(project.projectFee),
      expanded: false,
    }));

    // Combine and deduplicate
    const combinedProjects = [
      ...loadedProjects,
      ...inProgressProjects,
    ].filter((project, index, self) => index === self.findIndex((p) => p.id === project.id));

    setFreelancerProjects(combinedProjects);
  };

  /* ------------------------- Handlers ------------------------- */

  const handleSelectFreelancer = async (projectId, freelancerAddress) => {
    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const tx = await contract.selectFreelancer(projectId, freelancerAddress);
      await tx.wait();

      alert("Freelancer selected successfully!");
      await loadProjects();
    } catch (error) {
      console.error("Error selecting freelancer:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkProjectCompleted = async (projectId) => {
    if (!proofLink) {
      alert("Please provide a proof link before marking the project completed.");
      return;
    }

    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const tx = await contract.markProjectAsCompleted(projectId, proofLink);
      await tx.wait();

      alert("Project marked as completed and now waiting for client approval!");
      await loadProjects();
      setProofLink("");
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

      // Reset form
      setFormData({ name: "", description: "", projectFee: "" });
      setShowModal(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project. Please try again.");
      setIsLoading(false);
    }
  };

  /* ------------------------- Render ------------------------- */

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

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1>Your Projects</h1>
        <p>View and manage your ongoing projects as a Client or Freelancer.</p>
      </header>

      {/* Tabs for Client / Freelancer */}
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
                <div className="right-section">
                  {activeTab === "freelancer" && project.status === "Open" ? (
                    <span className="status open">Request Sent</span>
                  ) : (
                    renderProjectStatus(project.status)
                  )}
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

                  {/* Proof Section for Client when project is Waiting for Approval */}
                  {activeTab === "client" &&
                    project.status === "Waiting For Approval" && (
                      <div className="proof-section">
                        <h4>
                          Proof of Completion:
                          {project.proofLink ? (
                            <a
                              href={project.proofLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {project.proofLink}
                            </a>
                          ) : (
                            <p>No proof link provided.</p>
                          )}
                        </h4>
                      </div>
                    )}

                  {activeTab === "freelancer" && (
                    <div className="project-stipend">
                      <strong>Stipend:</strong> {project.projectFee} ETH
                    </div>
                  )}
                  {/* Freelancer: Submit proof when in Progress */}
                  {activeTab === "freelancer" &&
                    project.status === "In Progress" && (
                      <div className="proof-input-section">
                        <input
                          type="text"
                          placeholder="Enter proof link (e.g. Google Drive, IPFS)"
                          value={proofLink}
                          onChange={(e) => setProofLink(e.target.value)}
                        />
                        <button
                          className="mark-completed-button"
                          onClick={() => handleMarkProjectCompleted(project.id)}
                          disabled={isLoading || !proofLink.trim()}
                        >
                          Submit Proof & Mark Completed
                        </button>
                      </div>
                    )}

                  {/* Client: Approve or Dispute project completion */}
                  {activeTab === "client" &&
                    project.status === "Waiting For Approval" && (
                      <div className="project-approval-buttons">
                        <button
                          className="approve-button"
                          onClick={() =>
                            handleApproveProjectCompletion(project.id)
                          }
                          disabled={isLoading}
                        >
                          Approve Completion
                        </button>
                        <button
                          className="dispute-button"
                          onClick={() =>
                            handleDisputeProjectCompletion(project.id)
                          }
                          disabled={isLoading}
                        >
                          Dispute Completion
                        </button>
                      </div>
                    )}

                  {/* Client: Potential Freelancers when project is Open */}
                  {activeTab === "client" &&
                    project.status === "Open" &&
                    project.potentialFreelancers.length > 0 && (
                      <div className="potential-freelancers">
                        <h4>Potential Freelancers:</h4>
                        {project.potentialFreelancers.map(
                          (freelancer, index) => (
                            <div key={index}>
                              <FreelancerItem
                                client={walletAddress}
                                freelancer={freelancer}
                                projectId={project.id}
                                handleSelectFreelancer={handleSelectFreelancer}
                                isLoading={isLoading}
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {/* Client: Selected Freelancer details when In Progress or Completed */}
                  {activeTab === "client" &&
                    (project.status === "In Progress" ||
                      project.status === "Completed" || project.status === "") && (
                      <div className="potential-freelancers">
                        <h4>Selected Freelancer:</h4>
                        <div className="freelancer-item">
                          <div className="freelancer-header">
                            <h4>{project.selectedFreelancer.name}</h4>
                            <span>
                              Wallet: {project.selectedFreelancer.address}
                            </span>
                          </div>

                          <div className="freelancer-details">
                            <div>
                              <strong>Projects Completed:</strong>{" "}
                              {project.selectedFreelancer.projectsCompleted}
                            </div>
                            <div>
                              <strong>Description:</strong>{" "}
                              {project.selectedFreelancer.description}
                            </div>
                            <div>
                              <strong>Github:</strong>{" "}
                              {project.selectedFreelancer.githubLink ? (
                                <a
                                  href={project.selectedFreelancer.githubLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View
                                </a>
                              ) : (
                                "N/A"
                              )}
                            </div>
                            <div>
                              <strong>LinkedIn:</strong>{" "}
                              {project.selectedFreelancer.linkedinLink ? (
                                <a
                                  href={project.selectedFreelancer.linkedinLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View
                                </a>
                              ) : (
                                "N/A"
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Client: Remove Open Project */}
                  {activeTab === "client" && project.status === "Open" && (
                    <button
                      className="remove-project-button"
                      onClick={() => handleRemoveProject(project.id)}
                    >
                      Remove Project
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Modal for Creating a New Project */}
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

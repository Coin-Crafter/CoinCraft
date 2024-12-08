import React, { useState, useEffect } from "react";
import "./yourprojects.css";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import contractABI from "../../contract/contractABI.json";
import { db } from "../../firebase.jsx";
import { contractAddress } from "../../contract/contractAddress";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import FreelancerItem from "./freelancerItem.jsx"

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [clientProjects, setClientProjects] = useState([]);
  const [freelancerProjects, setFreelancerProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", projectFee: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [potentialFreelancers, setPotentialFreelancers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [proofLink, setProofLink] = useState("");

  useEffect(() => {
    const getWalletAddress = async () => {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const walletAddress = await signer.getAddress();
      setWalletAddress(walletAddress);
    };
    getWalletAddress();
  }, []);

  const fetchUserProfile = async (walletAddress) => {
    try {
      const allUsersData = await collection(db, "profiles");
      const allUsersSnapshot = await getDocs(allUsersData);
      // console.log(allUsersSnapshot.docs.map(doc => doc.data()));
      console.log("Searching for wallet address:", walletAddress);
      const normalizedWalletAddress = walletAddress.toLowerCase();

       // Iterate over the documents
      allUsersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();

        // Normalize the wallet address from the database for comparison
        const normalizedUserWalletAddress = userData.walletAddress.toLowerCase();

        // Check if it matches
        if (normalizedUserWalletAddress === normalizedWalletAddress) {
          console.log("Match found:", userData);
        } else {
          console.log(userData.walletAddress, "does not match", walletAddress);
        }

        return userData;
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchFreelancerName = async (walletAddress) => {
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
  };

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

    await fetchUserProfile(walletAddress);

    if (activeTab === "client") {
      const blockchainProjects = await contract.getProjectsByAddress(walletAddress);

      const loadedProjects = await Promise.all(blockchainProjects.map(async (project) => {
        // Include projects in Open or In Progress status for client
        if (project.status === 0n || project.status === 1n || project.status === 2n || project.status === 3n || project.status === 4n || project.status === 5n) { 
          const freelancers = project.potentialFreelancers || [];
          const freelancerName = await fetchFreelancerName(project.selectedFreelancer);

          
          return {
            id: Number(project.id),
            title: project.name,
            description: project.description,
            status: getStatusString(project.status),
            projectFee: formatEther(project.projectFee),
            proofLink: project.proofLink,
            expanded: false,
            potentialFreelancers: freelancers,
            selectedFreelancer: {
                address: project.selectedFreelancer,
                name: freelancerName,
              },
          };
        }
        return null;
      })).then(projects => projects.filter(project => project !== null));

      setClientProjects(loadedProjects);
    } else if (activeTab === "freelancer") {
      const allProjects = await contract.getProjectsByStatus(0n); // Get all Open projects
      
      const loadedProjects = allProjects.filter(project => 
        project.potentialFreelancers.some(
          freelancer => freelancer.toLowerCase() === walletAddress.toLowerCase()
        )
      ).map((project) => ({
        id: Number(project.id),
        title: project.name,
        description: project.description,
        status: getStatusString(project.status),
        projectFee: formatEther(project.projectFee),
        expanded: false,
      }));

      // Also fetch the freelancer's own in-progress projects
      const freelancerProjects = await contract.getProjectsForFreelancer(walletAddress);
      const inProgressProjects = freelancerProjects.map((project) => ({
        id: Number(project.id),
        title: project.name,
        description: project.description,
        status: getStatusString(project.status),
        projectFee: formatEther(project.projectFee),
        expanded: false,
      }));

      // Combine and remove duplicates
      const combinedProjects = [
        ...loadedProjects, 
        ...inProgressProjects
      ].filter((project, index, self) => 
        index === self.findIndex((p) => p.id === project.id)
      );

      setFreelancerProjects(combinedProjects);
    }
  } catch (error) {
    console.error("Error loading projects:", error);
  }
};
  useEffect(() => {
    loadProjects();
  }, [activeTab]);


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
    if (!proofLink) {
      alert("Please provide a proof link before marking the project completed.");
      return;
    }

    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      // Call the updated contract function with proof link
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
    // if (
    //   status === "Open" &&
    //   potentialFreelancers &&
    //   potentialFreelancers.some(
    //     (freelancer) => freelancer.toLowerCase() === walletAddress.toLowerCase()
    //   )
    // ) {
    //   return <span className="status request-sent">Request Sent</span>;
    // }

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

  // Fetch multiple freelancer profiles
  const fetchFreelancerProfiles = async (freelancerAddresses) => {
    try {
      const profiles = {};
      const profilePromises = freelancerAddresses.map(async (address) => {
        const docRef = doc(db, "profiles", address);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          profiles[address] = docSnap.data();
        } else {
          profiles[address] = null; // Handle profiles not found
        }
      });

      await Promise.all(profilePromises);
      return profiles;
    } catch (error) {
      console.error("Error fetching freelancer profiles:", error);
      return {};
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
                  {/* Show proof link if project is WaitingForApproval and user is client */}
                  {activeTab === "client" &&
                    project.status === "Waiting For Approval" && (
                      <div className="proof-section">
                        <h4>Proof of Completion:</h4>
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

                        <p>{project.freelancer}</p>
                      </div>
                    )}

                  {/* Freelancer: Enter Proof Link and Mark Project as Completed */}
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
                          disabled={isLoading}
                        >
                          Submit Proof & Mark Completed
                        </button>
                      </div>
                    )}

                  {/* Client: Approve or Dispute Project */}
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

                  {activeTab === "client" &&
                    project.status === "Open" &&
                    project.potentialFreelancers.length > 0 && (
                      <div className="potential-freelancers">
                        <h4>Potential Freelancers:</h4>
                        {project.potentialFreelancers.map(
                          (freelancer, index) => (
                            <div key={index} className="freelancer-item">
                              {/* <span>{freelancer}</span> */}
                              <FreelancerItem
                                client={walletAddress}
                                freelancer={freelancer}
                                projectId={project.id}
                                handleSelectFreelancer={handleSelectFreelancer}
                                isLoading={isLoading}
                              />
                              {/* <button 
                          className="select-freelancer-button"
                          onClick={() => handleSelectFreelancer(project.id, freelancer)}
                          disabled={isLoading}
                        >
                          Select Freelancer
                        </button> */}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {activeTab === "client" && project.status === "In Progress" && (     
                      <div>
                        <h4>Selected Freelancer:</h4>
                        {project.selectedFreelancer?.address ? (
                          <>
                            <p>
                              <strong>Name:</strong> {project.selectedFreelancer.name}
                            </p>
                            <p>
                              <strong>Wallet Address:</strong> {project.selectedFreelancer.address}
                            </p>
                          </>
                        ) : (
                          <p>No freelancer selected yet.</p>
                        )}
                      </div>
                    )}


                  {/* Only show the remove button for client projects */}
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
import React, { useState } from "react";
import "./yourprojects.css";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [clientProjects, setClientProjects] = useState([
    { id: 1, title: "Client Project 1", status: "In Progress", expanded: false },
    { id: 2, title: "Client Project 2", status: "Completed", expanded: false },
  ]);
  const [freelancerProjects, setFreelancerProjects] = useState([
    { id: 3, title: "Freelance Project 1", status: "Pending Review", expanded: false },
    { id: 4, title: "Freelance Project 2", status: "In Progress", expanded: false },
  ]);

  const toggleExpand = (id) => {
    const updateProjects = (prevProjects) =>
      prevProjects.map((project) =>
        project.id === id
          ? { ...project, expanded: !project.expanded }
          : project
      );

    if (activeTab === "client") {
      setClientProjects(updateProjects);
    } else {
      setFreelancerProjects(updateProjects);
    }
  };

  return (
    <div className="projects-page">
      {/* Header Section */}
      <header className="projects-header">
        <h1 >Your Projects</h1>
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

      {/* Create New Project Button - Only visible for client tab */}
      {activeTab === "client" && (
        <div>
          <button className="create-button">+ Create a New Project</button>
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
                  {project.expanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>
            {project.expanded && (
              <div className="yprojects-details">
                <p>Details about {project.title}...</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;

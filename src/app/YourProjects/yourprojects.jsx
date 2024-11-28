import React, { useState } from "react";
import "./yourprojects.css";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [projects, setProjects] = useState([
    { id: 1, title: "Project 1", status: "In Progress", expanded: false },
    { id: 2, title: "Project 2", status: "Completed", expanded: false },
    { id: 3, title: "Project 3", status: "Pending Review", expanded: false },
  ]);

  const toggleExpand = (id) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === id
          ? { ...project, expanded: !project.expanded }
          : project
      )
    );
  };

  return (
    <div className="projects-page">
      {/* Header Section */}
      <header className="projects-header">
        <h1 >Your Projects</h1>
        <p>View and manage your ongoing projects as a Seller or Freelancer.</p>
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
      <button className="create-button">+ Create a New Project</button>

      {/* Project List */}
      <div className="projects-list">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-header" onClick={() => toggleExpand(project.id)}>
              <h3>{project.title}</h3>
              <span className="project-status">{project.status}</span>
              <button className="expand-button">
                {project.expanded ? "▲" : "▼"}
              </button>
            </div>
            {project.expanded && (
              <div className="project-details">
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

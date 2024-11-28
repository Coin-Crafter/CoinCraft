import React, { useState } from "react";
import "./addproject.css"; // Import styles
import ProjectCard from "../Listing/ProjectCard"; // Import card component

function Add() {
  const [projects, setProjects] = useState([
    {
      title: "Project 1",
      description:
        "Need a professional logo with writing underneath for our jewellery company",
      stipend: 100,
    },
    {
      title: "Project 2",
      description:
        "Need a professional logo with writing underneath for our jewellery company",
      stipend: 100,
    },
    {
      title: "Project 3",
      description:
        "Need a professional logo with writing underneath for our jewellery company",
      stipend: 100,
    },
  ]);

  const [showPopup, setShowPopup] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    stipend: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({ ...newProject, [name]: value });
  };

  const handleAddProject = () => {
    setProjects([
      ...projects,
      { ...newProject, stipend: parseFloat(newProject.stipend) },
    ]);
    setNewProject({ title: "", description: "", stipend: "" });
    setShowPopup(false);
  };

  return (
    <div className="listing-page">
      <button className="add-project-button" onClick={() => setShowPopup(true)}>
        Add Project
      </button>

      <div className="listing-header">
        <h1>Projects You Have Listed</h1>
      </div>

      <div className="project-grid">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            title={project.title}
            description={project.description}
            stipend={project.stipend}
          />
        ))}
      </div>

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h2>Add New Project</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={newProject.title}
                onChange={handleInputChange}
                placeholder="Enter project title"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                placeholder="Enter project description"
              />
            </div>
            <div className="form-group">
              <label>Stipend</label>
              <input
                type="number"
                name="stipend"
                value={newProject.stipend}
                onChange={handleInputChange}
                placeholder="Enter stipend amount"
              />
            </div>
            <button className="submit-button" onClick={handleAddProject}>
              Submit
            </button>
            <button
              className="cancel-button"
              onClick={() => setShowPopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Add;

import React from "react";
import ProjectCard from "./ProjectCard"; // Import card component
import "./listing.css"; // Import styles

function Listing() {
  const projects = [
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
  ];

  return (
    <div className="listing-page">
      <div className="listing-header">
        <h1>Project Listing</h1>
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
      <button className="add-project-button">Add Project</button>
    </div>
  );
}

export default Listing;

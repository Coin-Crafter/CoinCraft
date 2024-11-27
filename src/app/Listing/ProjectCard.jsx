import React from "react";
import "./listing.css"; // Import styles


function ProjectCard({ title, description, stipend }) {
  return (
    <div className="project-card">
      <img
        src={process.env.PUBLIC_URL + '/asset/company_logo.jpg'} // Correct syntax for using the imported image
        alt="Project Logo"
        className="project-logo"
      />
      <h2 className="project-title">{title}</h2>
      <p className="project-description">{description}</p>
      <div className="project-details">
        <span className="project-stipend">Project Stipend: ${stipend}</span>
        <a href="#" className="accept-project-link">
          Accept Project
        </a>
      </div>
    </div>
  );
}

export default ProjectCard;

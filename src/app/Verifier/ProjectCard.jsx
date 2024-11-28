import React from "react";
import "./verifier.css"; // Import styles

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
      {/* <div className="project-details"> */}
        <div>
          <span className="project-stipend">Project Fee: ${stipend}</span>
        </div>
      
      <br></br>
      {/* </div> */}
      <div>
        {/* <button className="accept-project-button">
            Accept Project
        </button> */}
      
        <div className="button-gradient-wrapper">
        <div className="button-inner-wrapper">
          <button className="gradient-button">Choose to Verify</button>
        </div>
      </div>

      </div>
    </div>
  );
}

export default ProjectCard;
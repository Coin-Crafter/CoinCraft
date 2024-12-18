import React from 'react';
import './Content.css'; // Import CSS file
import { Link } from "react-router-dom";

const Content = () => (
  <div className="content-container">
    <h1 className="content-title">Decentralize Freelancing</h1>
    <p className="content-subtitle">
      Secure, transparent, and efficient freelancing platform powered by blockchain technology.
    </p>
    {/* <div className="content-buttons">
      <button className="content-button">Post a Project</button>
      <button className="content-button">Find a Project</button>
    </div> */}
    <div className="content-buttons">
      {/* Button with Gradient Border */}
      <div className="button-gradient-wrapper-3">
        <div className="button-inner-wrapper-3">
          <button className="gradient-button-3"><Link to={"/your-projects"} className="link">Post a Project</Link></button>
        </div>
      </div>

      {/* White Button */}
      {/* <div className="button-gradient-wrapper">
        <div className="button-inner-wrapper">
          <button className="white-button">Find a Project</button>
        </div>
      </div> */}

      <div className="button-solid-wrapper-3">
        <div className="button-inner-wrapper-3">
          <button className="gradient-button-3"><Link to={"/project-listing"} className="link">Find a Project</Link></button>
        </div>
      </div>
    </div>
    <img className="content-image" src={process.env.PUBLIC_URL + '/asset/contentImage.png'} alt="Content" />
  </div>
);

export default Content;

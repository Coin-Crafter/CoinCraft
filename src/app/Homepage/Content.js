import React from 'react';
import './Content.css'; // Import CSS file

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
      <div className="button-gradient-wrapper">
        <div className="button-inner-wrapper">
          <button className="gradient-button">Post a Project</button>
        </div>
      </div>

      {/* White Button */}
      {/* <div className="button-gradient-wrapper">
        <div className="button-inner-wrapper">
          <button className="white-button">Find a Project</button>
        </div>
      </div> */}

      <div className="white-border-button-wrapper">
        <button className="white-border-button">Find a Project</button>
      </div>
    </div>
    <img className="content-image" src={process.env.PUBLIC_URL + '/asset/contentImage.png'} alt="Content" />
  </div>
);

export default Content;

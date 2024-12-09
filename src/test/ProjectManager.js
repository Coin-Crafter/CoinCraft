// // test/ProjectManager.js

// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("ProjectManager", function () {
//   let ProjectManager;
//   let projectManager;
//   let owner;
//   let addr1; // Project creator
//   let addr2; // Freelancer
//   let addr3; // Another freelancer

//   beforeEach(async function () {
//     ProjectManager = await ethers.getContractFactory("ProjectManager");
//     [owner, addr1, addr2, addr3] = await ethers.getSigners();
//     projectManager = await ProjectManager.deploy();
//     await projectManager.deployed();
//   });

//   it("Should create a new project", async function () {
//     const projectName = "Test Project";
//     const projectDescription = "A description";
//     const timestamp = Math.floor(Date.now() / 1000);
//     const projectFee = ethers.utils.parseEther("1.0");

//     await expect(
//       projectManager
//         .connect(addr1)
//         .createProject(projectName, projectDescription, timestamp, projectFee, { value: projectFee })
//     )
//       .to.emit(projectManager, "ProjectCreated")
//       .withArgs(0, projectName, addr1.address);

//     const project = await projectManager.projects(0);
//     expect(project.name).to.equal(projectName);
//     expect(project.description).to.equal(projectDescription);
//     expect(project.creator).to.equal(addr1.address);
//   });

//   it("Should allow freelancer to apply for a project", async function () {
//     // Create a project first
//     const projectName = "Test Project";
//     const projectDescription = "A description";
//     const timestamp = Math.floor(Date.now() / 1000);
//     const projectFee = ethers.utils.parseEther("1.0");

//     await projectManager
//       .connect(addr1)
//       .createProject(projectName, projectDescription, timestamp, projectFee, { value: projectFee });

//     // Freelancer applies for the project
//     await expect(projectManager.connect(addr2).applyForProject(0))
//       .to.emit(projectManager, "FreelancerApplied")
//       .withArgs(0, addr2.address);

//     const freelancers = await projectManager.getPotentialFreelancers(0);
//     expect(freelancers).to.include(addr2.address);
//   });

//   it("Should allow project creator to select a freelancer", async function () {
//     // Create a project
//     const projectName = "Test Project";
//     const projectDescription = "A description";
//     const timestamp = Math.floor(Date.now() / 1000);
//     const projectFee = ethers.utils.parseEther("1.0");

//     await projectManager
//       .connect(addr1)
//       .createProject(projectName, projectDescription, timestamp, projectFee, { value: projectFee });

//     // Freelancers apply
//     await projectManager.connect(addr2).applyForProject(0);
//     await projectManager.connect(addr3).applyForProject(0);

//     // Project creator selects a freelancer
//     await expect(projectManager.connect(addr1).selectFreelancer(0, addr2.address))
//       .to.emit(projectManager, "FreelancerSelected")
//       .withArgs(0, addr2.address);

//     const project = await projectManager.projects(0);
//     expect(project.selectedFreelancer).to.equal(addr2.address);
//     expect(project.status).to.equal(1); // Status.InProgress
//   });

//   it("Should allow freelancer to submit proof of work", async function () {
//     // Create a project
//     const projectName = "Test Project";
//     const projectDescription = "A description";
//     const timestamp = Math.floor(Date.now() / 1000);
//     const projectFee = ethers.utils.parseEther("1.0");

//     await projectManager
//       .connect(addr1)
//       .createProject(projectName, projectDescription, timestamp, projectFee, { value: projectFee });

//     // Freelancer applies and is selected
//     await projectManager.connect(addr2).applyForProject(0);
//     await projectManager.connect(addr1).selectFreelancer(0, addr2.address);

//     // Freelancer submits work
//     const proofLink = "https://example.com/proof";
//     await expect(projectManager.connect(addr2).submitWork(0, proofLink))
//       .to.emit(projectManager, "WorkSubmitted")
//       .withArgs(0, addr2.address, proofLink);

//     const project = await projectManager.projects(0);
//     expect(project.proofLink).to.equal(proofLink);
//     expect(project.status).to.equal(2); // Status.WaitingForApproval
//   });
// });
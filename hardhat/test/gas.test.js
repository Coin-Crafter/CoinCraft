// gas.test.js
const { ethers } = require("hardhat");
const { describe, it, before } = require("mocha");
const { expect } = require("chai");

describe("ProjectManager Gas Usage Tests", function () {
  let contract;
  let owner, freelancer, verifier1, verifier2, verifier3;

  // Enum representation aligned with the smart contract's Status enum
  const ProjectState = {
    Open: 0,
    InProgress: 1,
    WaitingForApproval: 2,
    InDispute: 3,
    Completed: 4,
  };

  before(async () => {
    [owner, freelancer, verifier1, verifier2, verifier3] = await ethers.getSigners();
    const ProjectManager = await ethers.getContractFactory("ProjectManager");
    contract = await ProjectManager.deploy();
    // No need to await contract.deployed() in Ethers v6
  });

  async function logGasUsage(fnName, tx) {
    try {
      const receipt = await tx.wait();
      console.log(`${fnName}: Gas Used - ${receipt.gasUsed.toString()}`);
    } catch (error) {
      console.error(`Error during ${fnName}:`, error);
      throw error; // Re-throw to fail the test
    }
  }

  async function getProjectState(projectId) {
    const project = await contract.projects(projectId);
    const state = project.status;
    console.log(`Project ${projectId} State: ${Object.keys(ProjectState)[state]}`);
    return state;
  }

  describe("Approval Path", function () {
    it("Logs gas usage for all approval functions", async () => {
      // Create Project
      let tx = await contract.createProject(
        "Approval Project",
        "Project for approval path",
        Math.floor(Date.now() / 1000),
        ethers.parseEther("1"),
        { value: ethers.parseEther("1.0003") }
      );
      await logGasUsage("createProject (Approval Path)", tx);
      await getProjectState(0); // Project ID 0

      // Accept Project
      tx = await contract.connect(freelancer).acceptProject(0, {
        value: ethers.parseEther("0.0003"),
      });
      await logGasUsage("acceptProject (Approval Path)", tx);
      await getProjectState(0);

      // Select Freelancer
      tx = await contract.selectFreelancer(0, freelancer.address);
      await logGasUsage("selectFreelancer (Approval Path)", tx);
      await getProjectState(0);

      // Mark Project as Completed
      tx = await contract
        .connect(freelancer)
        .markProjectAsCompleted(0, "https://example.com/proof");
      await logGasUsage("markProjectAsCompleted (Approval Path)", tx);
      await getProjectState(0);

      // Approve Project Completion
      tx = await contract.approveProjectCompletion(0);
      await logGasUsage("approveProjectCompletion (Approval Path)", tx);
      await getProjectState(0);

      // Note: Dispute is not called here as the project is already approved
    });
  });

  describe("Dispute Path", function () {
    it("Logs gas usage for all dispute functions", async () => {
      // Create a second Project for dispute
      let tx = await contract.createProject(
        "Dispute Project",
        "Project for dispute path",
        Math.floor(Date.now() / 1000),
        ethers.parseEther("2"),
        { value: ethers.parseEther("2.0003") }
      );
      await logGasUsage("createProject (Dispute Path)", tx);
      await getProjectState(1); // Project ID 1

      // Accept Project
      tx = await contract.connect(freelancer).acceptProject(1, {
        value: ethers.parseEther("0.0003"),
      });
      await logGasUsage("acceptProject (Dispute Path)", tx);
      await getProjectState(1);

      // Select Freelancer
      tx = await contract.selectFreelancer(1, freelancer.address);
      await logGasUsage("selectFreelancer (Dispute Path)", tx);
      await getProjectState(1);

      // Mark Project as Completed
      tx = await contract
        .connect(freelancer)
        .markProjectAsCompleted(1, "https://example.com/proof");
      await logGasUsage("markProjectAsCompleted (Dispute Path)", tx);
      await getProjectState(1);

      // Dispute Project Completion
      tx = await contract.disputeProjectCompletion(1);
      await logGasUsage("disputeProjectCompletion (Dispute Path)", tx);
      await getProjectState(1);

      // Verify Project Completion (Multiple Verifiers)
      tx = await contract.connect(verifier1).verifyProjectCompletion(1, true, {
        value: ethers.parseEther("0.0003"),
      });
      await logGasUsage("verifyProjectCompletion (Verifier 1, Dispute Path)", tx);
      await getProjectState(1);

      tx = await contract.connect(verifier2).verifyProjectCompletion(1, false, {
        value: ethers.parseEther("0.0003"),
      });
      await logGasUsage("verifyProjectCompletion (Verifier 2, Dispute Path)", tx);
      await getProjectState(1);

      tx = await contract.connect(verifier3).verifyProjectCompletion(1, true, {
        value: ethers.parseEther("0.0003"),
      });
      await logGasUsage("verifyProjectCompletion (Verifier 3, Dispute Path)", tx);
      await getProjectState(1);

      // Remove Project (Only applicable if project is open; in this path, it's likely completed or disputed)
      // Depending on your contract logic, you might not be able to remove a project in certain states.
      // Uncomment the following lines if removal is valid in this state.

      // tx = await contract.removeProject(1);
      // await logGasUsage("removeProject (Dispute Path)", tx);
      // await getProjectState(1);
    });
  });
});

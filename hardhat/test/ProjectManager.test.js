/* eslint-disable no-undef */
const { ethers } = require("hardhat");
const assert = require('chai').assert;

describe("ProjectManager Contract", function () {
  let ProjectManager;
  let projectManager;
  let creator, freelancer1, freelancer2, verifier1, verifier2, verifier3, other;

  const verificationFee = ethers.parseEther("0.0003");

  before(async () => {
    [creator, freelancer1, freelancer2, verifier1, verifier2, verifier3, other] =
      await ethers.getSigners();

    ProjectManager = await ethers.getContractFactory("ProjectManager");
  });

  beforeEach(async () => {
    projectManager = await ProjectManager.deploy();
    await projectManager.waitForDeployment();
  });

  describe("Project Creation", () => {
    it("should create a project with correct values", async () => {
      const projectFee = ethers.parseEther("1");
      const totalValue = projectFee + verificationFee;

      const tx = await projectManager
          .connect(creator)
          .createProject(
              "Test Project",
              "A sample project",
              Math.floor(Date.now() / 1000),
              projectFee,
              { value: totalValue }
          );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
          (log) => log.address === projectManager.target && log.topics[0] === projectManager.interface.getEvent("ProjectCreated").topicHash
      );

      assert.exists(event);

      const projects = await projectManager.getProjectsByAddress(creator.address);
      assert.lengthOf(projects, 1);

      const project = projects[0];
      assert.equal(project.name, "Test Project");
      assert.equal(project.description, "A sample project");
      assert.equal(project.projectFee, projectFee);
      assert.equal(project.creator, creator.address);
    });

    it("should revert if incorrect ETH is sent", async () => {
      const projectFee = ethers.parseEther("1");

      try {
          await projectManager
              .connect(creator)
              .createProject(
                  "Invalid Project",
                  "Description",
                  Math.floor(Date.now() / 1000),
                  projectFee,
                  { value: ethers.parseEther("0.5") }
              );
          assert.fail("The transaction should have reverted.");
      } catch (error) {
          assert.include(error.message, "Incorrect ETH sent", "Revert reason should match");
      }
    });
  });

  describe("Accepting and Selecting a Freelancer", () => {
    let projectFee, totalValue, projectId;

    beforeEach(async () => {
      projectFee = ethers.parseEther("1");
      totalValue = projectFee + verificationFee;

      const tx = await projectManager
        .connect(creator)
        .createProject(
          "Project X",
          "Desc X",
          Math.floor(Date.now() / 1000),
          projectFee,
          { value: totalValue }
        );
      await tx.wait();

      projectId = 0;
    });

    it("should allow freelancers to accept an open project", async () => {
      await projectManager
        .connect(freelancer1)
        .acceptProject(projectId, { value: verificationFee });

      const project = (await projectManager.getProjectsByAddress(creator.address))[0];
      assert.include(project.potentialFreelancers, freelancer1.address);
    });

    it("should select a freelancer and mark project as InProgress", async () => {
      await projectManager
        .connect(freelancer1)
        .acceptProject(projectId, { value: verificationFee });

      await projectManager
        .connect(freelancer2)
        .acceptProject(projectId, { value: verificationFee });

      await projectManager
        .connect(creator)
        .selectFreelancer(projectId, freelancer1.address);

      const project = (await projectManager.getProjectsByAddress(creator.address))[0];
      assert.equal(project.selectedFreelancer, freelancer1.address);
      assert.equal(project.status, 1); // Status.InProgress
    });
  });

  describe("Completing and Approving Project", () => {
    let projectFee, totalValue, projectId;

    beforeEach(async () => {
      projectFee = ethers.parseEther("1");
      totalValue = projectFee + verificationFee;

      const tx = await projectManager
        .connect(creator)
        .createProject(
          "Completion Test",
          "Desc",
          Math.floor(Date.now() / 1000),
          projectFee,
          { value: totalValue }
        );
      await tx.wait();

      projectId = 0;

      await projectManager
        .connect(freelancer1)
        .acceptProject(projectId, { value: verificationFee });

      await projectManager
        .connect(creator)
        .selectFreelancer(projectId, freelancer1.address);
    });

    it("should mark project as completed by freelancer", async () => {
      const proofLink = "http://example.com/proof";

      await projectManager
        .connect(freelancer1)
        .markProjectAsCompleted(projectId, proofLink);

      const project = (await projectManager.getProjectsByAddress(creator.address))[0];
      assert.equal(project.status, 2); // Status.WaitingForApproval
      assert.equal(project.proofLink, proofLink);
    });

    it("should allow creator to approve project completion", async () => {
      const proofLink = "http://example.com/proof";

      await projectManager
        .connect(freelancer1)
        .markProjectAsCompleted(projectId, proofLink);

      const oldBalance = await ethers.provider.getBalance(freelancer1.address);

      await projectManager.connect(creator).approveProjectCompletion(projectId);

      const newBalance = await ethers.provider.getBalance(freelancer1.address);
      assert.isAbove(newBalance, oldBalance);

      const project = (await projectManager.getProjectsByAddress(creator.address))[0];
      assert.equal(project.status, 4); // Status.Completed
    });
  });

  describe("Verifier Actions", () => {
    let projectFee, totalValue, projectId;

    beforeEach(async () => {
      projectFee = ethers.parseEther("1");
      totalValue = projectFee + verificationFee;

      const tx = await projectManager
        .connect(creator)
        .createProject(
          "Verifier Test Project",
          "This project will be disputed",
          Math.floor(Date.now() / 1000),
          projectFee,
          { value: totalValue }
        );
      await tx.wait();

      projectId = 0;

      // Freelancer accepts and is selected
      await projectManager
        .connect(freelancer1)
        .acceptProject(projectId, { value: verificationFee });

      await projectManager
        .connect(creator)
        .selectFreelancer(projectId, freelancer1.address);

      // Freelancer marks project as completed
      const proofLink = "http://example.com/proof";
      await projectManager
        .connect(freelancer1)
        .markProjectAsCompleted(projectId, proofLink);

      // Creator disputes completion to trigger verifier stage
      await projectManager.connect(creator).disputeProjectCompletion(projectId);
    });

    it("should handle verifiers voting 'accept' majority and pay freelancer successfully", async () => {
      // Initial balances
      const oldFreelancerBalance = await ethers.provider.getBalance(freelancer1.address);

      // Verifiers vote: 2 accept, 1 reject
      await projectManager.connect(verifier1).verifyProjectCompletion(projectId, true, { value: verificationFee });
      await projectManager.connect(verifier2).verifyProjectCompletion(projectId, false, { value: verificationFee });
      await projectManager.connect(verifier3).verifyProjectCompletion(projectId, true, { value: verificationFee });

      const project = (await projectManager.getProjectsByAddress(creator.address))[0];

      // After majority accept, project should be completed successfully
      assert.equal(project.status, 4); // Status.Completed
      assert.equal(project.status2, 1); // Status2.Successful

      const newFreelancerBalance = await ethers.provider.getBalance(freelancer1.address);
      assert.isAbove(newFreelancerBalance, oldFreelancerBalance, "Freelancer should have gained ETH");
    });

    it("should handle verifiers voting 'reject' majority and refund client successfully", async () => {
      // Initial balances
      const oldCreatorBalance = await ethers.provider.getBalance(creator.address);

      // Verifiers vote: 2 reject, 1 accept
      await projectManager.connect(verifier1).verifyProjectCompletion(projectId, false, { value: verificationFee });
      await projectManager.connect(verifier2).verifyProjectCompletion(projectId, false, { value: verificationFee });
      await projectManager.connect(verifier3).verifyProjectCompletion(projectId, true, { value: verificationFee });

      const project = (await projectManager.getProjectsByAddress(creator.address))[0];

      // After majority reject, project should be completed unsuccessfully
      assert.equal(project.status, 4); // Status.Completed
      assert.equal(project.status2, 2); // Status2.Unsuccessful

      const newCreatorBalance = await ethers.provider.getBalance(creator.address);
      assert.isAbove(newCreatorBalance, oldCreatorBalance, "Creator should have been refunded");
    });
  });


  const testResults = [];
  let collectedAddresses;
  
  after(async function() {
    collectedAddresses = {
      Creator: creator.address,
      Freelancer1: freelancer1.address,
      Freelancer2: freelancer2.address,
      Verifier1: verifier1.address,
      Verifier2: verifier2.address,
      Verifier3: verifier3.address,
      Other: other.address,
      Contract: projectManager.target
    };
  });

  afterEach(async function () {
    if (this.currentTest) {
      const testData = {
        title: this.currentTest.title,
        fullTitle: this.currentTest.fullTitle(),
        state: this.currentTest.state,
        duration: this.currentTest.duration,
      };

      const addresses = [
        { name: "Creator", address: creator.address },
        { name: "Freelancer1", address: freelancer1.address },
        { name: "Freelancer2", address: freelancer2.address },
        { name: "Verifier1", address: verifier1.address },
        { name: "Verifier2", address: verifier2.address },
        { name: "Verifier3", address: verifier3.address },
        { name: "Other", address: other.address },
        { name: "Contract", address: projectManager.target }
      ];

      const balances = {};
      for (const addrObj of addresses) {
        const bal = await ethers.provider.getBalance(addrObj.address);
        balances[addrObj.name] = bal.toString();
      }
      testData.balances = balances;

      const creatorProjects = await projectManager.getProjectsByAddress(creator.address);
      const projectDetails = creatorProjects.map(p => ({
        id: p.id.toString(),
        name: p.name,
        description: p.description,
        timestamp: p.timestamp.toString(),
        creator: p.creator,
        potentialFreelancers: p.potentialFreelancers,
        selectedFreelancer: p.selectedFreelancer,
        status: p.status, 
        projectFee: p.projectFee.toString(),
        acceptVotes: p.acceptVotes.toString(),
        rejectVotes: p.rejectVotes.toString(),
        proofLink: p.proofLink,
        status2: p.status2 
      }));

      testData.projects = projectDetails;

      testResults.push(testData);
    }
  });

  after(function () {
    console.log("===== TEST REPORT =====");
    // Print known addresses
    console.log("Addresses Used:");
    for (const [role, addr] of Object.entries(collectedAddresses)) {
      console.log(`  ${role}: ${addr}`);
    }
    console.log("-----------------------\n");
    
    for (let i = 0; i < testResults.length; i++) {
      const result = testResults[i];
      console.log(`${i + 1}. Test: ${result.fullTitle}`);
      console.log(`   State: ${result.state}`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log("   Balances:");
      for (const [name, bal] of Object.entries(result.balances)) {
        console.log(`     ${name}: ${bal}`);
      }
      if (result.projects.length > 0) {
        console.log("   Projects:");
        for (const proj of result.projects) {
          console.log(`     ID: ${proj.id}, Name: ${proj.name}, Status: ${proj.status}, Status2: ${proj.status2}, Fee: ${proj.projectFee}`);
          console.log(`     Creator: ${proj.creator}`);
          console.log(`     SelectedFreelancer: ${proj.selectedFreelancer}`);
          console.log(`     ProofLink: ${proj.proofLink}`);
          console.log(`     AcceptVotes: ${proj.acceptVotes}, RejectVotes: ${proj.rejectVotes}`);
          console.log(`     PotentialFreelancers: [${proj.potentialFreelancers.join(", ")}]`);
          console.log(`     Timestamp: ${proj.timestamp}`);
        }
      } else {
        console.log("   Projects: None");
      }
      console.log("-----------------------");
    }
    console.log("=======================");
  });
});

/* eslint-disable no-undef */
const { ethers } = require("hardhat");

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
    
  const assert = require('chai').assert;


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
});

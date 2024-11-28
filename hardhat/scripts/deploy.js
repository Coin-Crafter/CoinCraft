const fs = require("fs");
const path = require("path");

async function main() {
  const hre = require("hardhat");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  // Get the ContractFactory and deploy the contract
  const ProjectManager = await hre.ethers.getContractFactory("ProjectManager");
  const projectManager = await ProjectManager.deploy();

  console.log("Waiting for deployment to complete...");
  await projectManager.waitForDeployment();

  const deployedAddress = projectManager.target;
  console.log("ProjectManager deployed to:", deployedAddress);

      // Read the full ABI from the artifacts folder
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/ProjectManager.sol/ProjectManager.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const fullABI = artifact.abi;
    
  // Save the contract address and ABI to the frontend
  const frontendPath = path.join(__dirname, "../../src/contract");
  
  // Ensure the directory exists
  if (!fs.existsSync(frontendPath)) {
    fs.mkdirSync(frontendPath, { recursive: true });
  }

  fs.writeFileSync(
    `${frontendPath}/contractAddress.js`,
    `export const contractAddress = "${deployedAddress}";\n`
  );

  fs.writeFileSync(
    `${frontendPath}/contractABI.json`,
    JSON.stringify(fullABI, null, 2) // Write the full ABI here
  );

  console.log("Contract address and full ABI updated in frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
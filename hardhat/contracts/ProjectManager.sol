// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProjectManager {
    enum Status {
        Open,
        InProgress,
        InDispute,
        Completed
    }

    struct Project {
        string name;
        string description;
        uint256 timestamp;
        address creator;
        address freelancer; // Address to which funds will be transferred
        Status status;
        uint256 projectFee;
        uint256 verificationFee;
        bool isTransferred; // To indicate if the funds have been transferred
    }

    Project[] public projects;

    uint256 public constant VERIFICATION_FEE = 0.0005 ether;

    event ProjectCreated(
        uint256 projectId,
        string name,
        string description,
        uint256 timestamp,
        address creator,
        Status status,
        uint256 projectFee,
        uint256 verificationFee
    );

    event FundsTransferred(uint256 projectId, address recipient, uint256 amount);

    // Function to create a project
    function createProject(
        string memory _name,
        string memory _description,
        uint256 _timestamp,
        uint256 _projectFee
    ) public {
        // Store the project details, including the fees
        projects.push(
            Project(
                _name,
                _description,
                _timestamp,
                msg.sender,
                address(0), // Freelancer not yet assigned
                Status.Open,
                _projectFee,
                VERIFICATION_FEE,
                false // Funds not yet transferred
            )
        );

        emit ProjectCreated(
            projects.length - 1,
            _name,
            _description,
            _timestamp,
            msg.sender,
            Status.Open,
            _projectFee,
            VERIFICATION_FEE
        );
    }

    // Function to transfer the locked fees to another address
    function transferFunds(uint256 _projectId, address _freelancer) public payable {
        // Validate the project exists
        require(_projectId < projects.length, "Project does not exist");

        Project storage project = projects[_projectId];

        // Ensure the caller is the project creator
        require(msg.sender == project.creator, "Only the creator can transfer funds");

        // Ensure the funds have not already been transferred
        require(!project.isTransferred, "Funds already transferred");

        // Ensure the exact amount is being sent
        uint256 totalFee = project.projectFee + project.verificationFee;
        require(msg.value == totalFee, "Incorrect fee amount sent");

        // Transfer funds to the specified freelancer
        project.freelancer = _freelancer;
        project.isTransferred = true;

        payable(_freelancer).transfer(msg.value);

        emit FundsTransferred(_projectId, _freelancer, msg.value);
    }

    // Function to get projects by creator address
    function getProjectsByAddress(address _creator) public view returns (Project[] memory) {
        uint256 totalCount = 0;
        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].creator == _creator) {
                totalCount++;
            }
        }

        Project[] memory result = new Project[](totalCount);
        uint256 index = 0;

        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].creator == _creator) {
                result[index] = projects[i];
                index++;
            }
        }

        return result;
    }
}

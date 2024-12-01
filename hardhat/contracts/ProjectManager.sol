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
        bool isActive;
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

    event ProjectRemoved(uint256 projectId, address creator);
    event FundsTransferred(
        uint256 projectId,
        address recipient,
        uint256 amount
    );
    event ProjectStatusChanged(uint256 projectId, Status newStatus);

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
                false, // Funds not yet transferred
                true
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

    function updateProjectStatus(uint256 _projectId, Status _newStatus) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];

        require(
            msg.sender == project.creator,
            "Only the project creator can update status"
        );
        require(project.isActive, "Project is not active");

        project.status = _newStatus;
        emit ProjectStatusChanged(_projectId, _newStatus);
    }

    function removeProject(uint256 _projectId) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];

        require(
            msg.sender == project.creator,
            "Only the project creator can remove the project"
        );
        require(
            project.status == Status.Open,
            "Only open projects can be removed"
        );

        // Remove the project by replacing it with the last project in the array
        // and then reducing the array length
        if (_projectId != projects.length - 1) {
            projects[_projectId] = projects[projects.length - 1];
        }

        // Remove the last element of the array
        projects.pop();

        emit ProjectRemoved(_projectId, msg.sender);
    }

    // Function to transfer the locked fees to another address
    function transferFunds(
        uint256 _projectId,
        address _freelancer
    ) public payable {
        require(_projectId < projects.length, "Project does not exist");

        Project storage project = projects[_projectId];

        require(
            msg.sender == project.creator,
            "Only the creator can transfer funds"
        );
        require(!project.isTransferred, "Funds already transferred");
        uint256 totalFee = project.projectFee + project.verificationFee;
        require(msg.value == totalFee, "Incorrect fee amount sent");

        project.freelancer = _freelancer;
        project.isTransferred = true;

        // Forward the funds to the freelancer
        (bool success, ) = payable(_freelancer).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit FundsTransferred(_projectId, _freelancer, msg.value);
    }

    // Function to get projects by creator address
    function getProjectsByAddress(
        address _creator
    ) public view returns (Project[] memory) {
        uint256 totalCount = 0;
        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].creator == _creator && projects[i].isActive) {
                totalCount++;
            }
        }

        Project[] memory result = new Project[](totalCount);
        uint256 index = 0;

        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].creator == _creator && projects[i].isActive) {
                result[index] = projects[i];
                index++;
            }
        }

        return result;
    }
    // Getter to retrieve all projects with a specific status
    function getProjectsByStatus(
        Status _status
    ) public view returns (Project[] memory) {
        uint256 totalCount = 0;

        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].status == _status) {
                totalCount++;
            }
        }

        Project[] memory result = new Project[](totalCount);
        uint256 index = 0;

        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].status == _status) {
                result[index] = projects[i];
                index++;
            }
        }

        return result;
    }
}

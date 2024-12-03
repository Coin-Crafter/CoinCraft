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
        uint256 id;
        string name;
        string description;
        uint256 timestamp;
        address creator;
        address freelancer; // Added freelancer field
        Status status;
        uint256 projectFee;
    }

    Project[] public projects;

    uint256 public verificationFee = 0.0003 ether;

    event ProjectCreated(
        uint256 projectId,
        string name,
        string description,
        uint256 timestamp,
        address creator,
        Status status,
        uint256 projectFee
    );

    event ProjectRemoved(uint256 projectId, address creator);

    event ProjectStatusUpdated(
        uint256 projectId,
        Status oldStatus,
        Status newStatus
    );

    function createProject(
        string memory _name,
        string memory _description,
        uint256 _timestamp,
        uint256 _projectFee
    ) public payable {
        require(
            msg.value == _projectFee + verificationFee,
            "Incorrect ETH sent"
        );

        uint256 projectId = projects.length;

        projects.push(
            Project(
                projectId,
                _name,
                _description,
                _timestamp,
                msg.sender,
                address(0), // No freelancer yet
                Status.Open,
                _projectFee
            )
        );
        emit ProjectCreated(
            projectId,
            _name,
            _description,
            _timestamp,
            msg.sender,
            Status.Open,
            _projectFee
        );
    }

    function acceptProject(uint256 _projectId) public payable {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];

        require(
            msg.sender != project.creator,
            "Creator cannot accept own project"
        );
        require(project.status == Status.Open, "Project is not open");
        require(
            project.freelancer == address(0),
            "Project already has a freelancer"
        );
        require(msg.value == verificationFee, "Incorrect verification fee");

        project.freelancer = msg.sender;
        project.status = Status.InProgress;

        emit ProjectStatusUpdated(_projectId, Status.Open, Status.InProgress);
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

        uint256 refundAmount = project.projectFee + verificationFee;

        if (_projectId != projects.length - 1) {
            projects[_projectId] = projects[projects.length - 1];
            projects[_projectId].id = _projectId;
        }

        projects.pop();

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit ProjectRemoved(_projectId, msg.sender);
    }

    function getProjectsByAddress(
        address _creator
    ) public view returns (Project[] memory) {
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

    function getProjectsForFreelancer(
        address _freelancer
    ) public view returns (Project[] memory) {
        uint256 totalCount = 0;

        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].freelancer == _freelancer) {
                totalCount++;
            }
        }

        Project[] memory result = new Project[](totalCount);
        uint256 index = 0;

        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].freelancer == _freelancer) {
                result[index] = projects[i];
                index++;
            }
        }

        return result;
    }

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

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
        Status status;
    }

    Project[] public projects;

    event ProjectCreated(
        string name,
        string description,
        uint256 timestamp,
        address creator,
        Status status
    );

    event ProjectStatusUpdated(
        uint256 projectId,
        Status oldStatus,
        Status newStatus
    );

    function createProject(
        string memory _name,
        string memory _description,
        uint256 _timestamp
    ) public {
        projects.push(Project(_name, _description, _timestamp, msg.sender, Status.Open));
        emit ProjectCreated(_name, _description, _timestamp, msg.sender, Status.Open);
    }

    function updateProjectStatus(uint256 _projectId, Status _newStatus) public {
        require(_projectId < projects.length, "Invalid project ID");
        require(
            projects[_projectId].creator == msg.sender,
            "Only the creator can update the status"
        );

        Status oldStatus = projects[_projectId].status;
        projects[_projectId].status = _newStatus;

        emit ProjectStatusUpdated(_projectId, oldStatus, _newStatus);
    }

    // Getter to retrieve all projects created by the current wallet address
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
    // Getter to retrieve all projects with a specific status
    function getProjectsByStatus(Status _status) public view returns (Project[] memory) {
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

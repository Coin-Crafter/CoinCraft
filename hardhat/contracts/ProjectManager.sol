// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProjectManager {
    struct Project {
        string name;
        string description;
        uint256 timestamp;
        address creator;
    }

    Project[] public projects;

    event ProjectCreated(
        string name,
        string description,
        uint256 timestamp,
        address creator
    );

    function createProject(
        string memory _name,
        string memory _description,
        uint256 _timestamp
    ) public {
        projects.push(Project(_name, _description, _timestamp, msg.sender));
        emit ProjectCreated(_name, _description, _timestamp, msg.sender);
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
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProjectManager {
    enum Status {
        Open,
        InProgress,
        WaitingForApproval,
        InDispute,
        Completed
    }

    enum Status2 {
        Incomplete,   
        Successful,
        Unsuccessful
    }

    struct Project {
        uint256 id;
        string name;
        string description;
        uint256 timestamp;
        address creator;
        // address freelancer;
        address[] potentialFreelancers;
        address selectedFreelancer;
        Status status;
        uint256 projectFee;
        uint256 acceptVotes;
        uint256 rejectVotes;
        string proofLink;
        Status2 status2;
    }

    Project[] public projects;
    uint256 public constant REQUIRED_VERIFIERS = 3;
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

    event FreelancerAccepted(uint256 projectId, address freelancer);

    event VerifierVoted(uint256 projectId, address verifier, bool vote);

    modifier onlyValidProject(uint256 _projectId) {
        require(_projectId < projects.length, "Project does not exist");
        _;
    }

    mapping(uint256 => address[]) public projectVerifiers; // Tracks verifiers
    mapping(uint256 => mapping(address => bool)) public hasVerified; // Tracks if a verifier has voted
    mapping(uint256 => mapping(address => bool)) public verifierVotes; // Verifier's vote
    mapping(uint256 => mapping(address => bool))
        public freelancerAcceptedProjects;

    function markProjectAsCompleted(uint256 _projectId, string memory _proofLink) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];

        require(
            msg.sender == project.selectedFreelancer,
            "Only the freelancer can mark project as completed"
        );
        require(
            project.status == Status.InProgress,
            "Project must be in progress"
        );
        require(
        bytes(_proofLink).length > 0,
        "Proof link cannot be empty"
    );
        project.proofLink = _proofLink;
        project.status = Status.WaitingForApproval;

        emit ProjectStatusUpdated(
            _projectId,
            Status.InProgress,
            Status.WaitingForApproval
        );
    }

    function approveProjectCompletion(uint256 _projectId) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];

        require(msg.sender == project.creator, "Only the project creator can approve");
        require(project.status == Status.WaitingForApproval, "Project must be waiting for approval");

        project.status = Status.Completed;
        project.status2 = Status2.Successful;

        (bool success, ) = payable(project.selectedFreelancer).call{
            value: project.projectFee + verificationFee
        }("");
        require(success, "Fee transfer to freelancer failed");

        // Return verification fee to client
        (bool successClient, ) = payable(project.creator).call{value: verificationFee}("");
        require(successClient, "Verification fee refund to client failed");

        emit ProjectStatusUpdated(_projectId, Status.WaitingForApproval, Status.Completed);
    }

    function disputeProjectCompletion(uint256 _projectId) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];

        require(msg.sender == project.creator, "Only the project creator can dispute");
        require(project.status == Status.WaitingForApproval, "Project must be waiting for approval");

        project.status = Status.InDispute;
        project.acceptVotes = 0;
        project.rejectVotes = 0;

        for (uint256 i = 0; i < projectVerifiers[_projectId].length; i++) {
            hasVerified[_projectId][projectVerifiers[_projectId][i]] = false;
        }

        delete projectVerifiers[_projectId];

        emit ProjectStatusUpdated(_projectId, Status.WaitingForApproval, Status.InDispute);
    }

    function verifyProjectCompletion(uint256 _projectId, bool _accept) public payable {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];

        require(
            msg.sender != project.creator && msg.sender != project.selectedFreelancer,
            "Verifier cannot be project creator or freelancer"
        );
        require(project.status == Status.InDispute, "Project must be in dispute");
        require(!hasVerified[_projectId][msg.sender], "Verifier has already voted");
        require(msg.value == verificationFee, "Incorrect verification fee");

        hasVerified[_projectId][msg.sender] = true;
        projectVerifiers[_projectId].push(msg.sender);

        if (_accept) {
            project.acceptVotes++;
        } else {
            project.rejectVotes++;
        }

        uint256 verifierReward = verificationFee / 3;
        uint256 refundAmount = verificationFee + verifierReward;

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Verifier reward transfer failed");

        emit VerifierVoted(_projectId, msg.sender, _accept);

        if (projectVerifiers[_projectId].length == REQUIRED_VERIFIERS) {
            if (project.acceptVotes >= 2) {
                // Majority accepts
                completeProject(_projectId);
            } else if (project.rejectVotes >= 2) {
                // Majority rejects
                completeProjectUnsuccessful(_projectId);
            }
        }
    }

    function completeProject(uint256 _projectId) private {
        Project storage project = projects[_projectId];
        project.status = Status.Completed;
        project.status2 = Status2.Successful;

        (bool freelancerPaid, ) = payable(project.selectedFreelancer).call{
            value: project.projectFee + verificationFee
        }("");
        require(freelancerPaid, "Freelancer payment failed");

        emit ProjectStatusUpdated(_projectId, Status.InDispute, Status.Completed);
    }

    // New function to mark project as completed but unsuccessful
    function completeProjectUnsuccessful(uint256 _projectId) private {
        Project storage project = projects[_projectId];
        project.status = Status.Completed;
        project.status2 = Status2.Unsuccessful;

        // Since the project is unsuccessful, refund the client
        (bool clientRefund, ) = payable(project.creator).call{
            value: project.projectFee + verificationFee
        }("");
        require(clientRefund, "Client refund failed");

        emit ProjectStatusUpdated(_projectId, Status.InDispute, Status.Completed);
    }

    function reopenProject(uint256 _projectId) private {
        Project storage project = projects[_projectId];

        project.status = Status.Open;
        project.selectedFreelancer = address(0);
        project.acceptVotes = 0;
        project.rejectVotes = 0;

        delete projectVerifiers[_projectId];

        emit ProjectStatusUpdated(_projectId, Status.InDispute, Status.Open);
    }

    function rejectProjectCompletion(uint256 _projectId) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];

        require(
            msg.sender != project.creator &&
                msg.sender != project.selectedFreelancer,
            "Verifier cannot be project creator or freelancer"
        );
        require(
            project.status == Status.InDispute,
            "Project must be in dispute"
        );

        project.status = Status.Open;
        project.selectedFreelancer = address(0);


        emit ProjectStatusUpdated(_projectId, Status.InDispute, Status.Open);
    }

    function createProject(
        string memory _name,
        string memory _description,
        uint256 _timestamp,
        uint256 _projectFee
    ) public payable {
        require(bytes(_name).length > 0, "Project name cannot be empty");
        require(bytes(_description).length > 0, "Project description cannot be empty");
        require(_projectFee > 0, "Project fee must be greater than zero");
        require(msg.value == _projectFee + verificationFee, "Incorrect ETH sent");

        uint256 projectId = projects.length;

        projects.push(
            Project(
                projectId,
                _name,
                _description,
                _timestamp,
                msg.sender,
                new address[](0),
                address(0),
                Status.Open,
                _projectFee,
                0,
                0,
                "",
                Status2.Incomplete
            )
        );

        emit ProjectCreated(projectId, _name, _description, _timestamp, msg.sender, Status.Open, _projectFee);
    }

    function acceptProject(
        uint256 _projectId
    ) public payable onlyValidProject(_projectId) {
        Project storage project = projects[_projectId];

        require(
            msg.sender != project.creator,
            "Creator cannot accept own project"
        );
        require(project.status == Status.Open, "Project is not open");
        require(
            !freelancerAcceptedProjects[_projectId][msg.sender],
            "Freelancer has already accepted this project"
        );
        require(msg.value == verificationFee, "Incorrect verification fee");

        // Add freelancer to potential freelancers
        project.potentialFreelancers.push(msg.sender);
        freelancerAcceptedProjects[_projectId][msg.sender] = true;

        emit FreelancerAccepted(_projectId, msg.sender);
    }

    function selectFreelancer(uint256 _projectId, address _freelancer) public {
        Project storage project = projects[_projectId];

        require(
            msg.sender == project.creator,
            "Only project creator can select a freelancer"
        );
        require(project.status == Status.Open, "Project is not open");
        require(
            freelancerAcceptedProjects[_projectId][_freelancer],
            "Freelancer has not accepted this project"
        );

        // Select the freelancer and change project status
        project.selectedFreelancer = _freelancer;
        project.status = Status.InProgress;

        delete project.potentialFreelancers;
        // Refund verification fees to unselected freelancers
        for (uint i = 0; i < project.potentialFreelancers.length; i++) {
            address potentialFreelancer = project.potentialFreelancers[i];
            if (potentialFreelancer != _freelancer) {
                (bool success, ) = payable(potentialFreelancer).call{
                    value: verificationFee
                }("");
                require(success, "Refund to unselected freelancer failed");
            }
        }

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

        for (uint i = 0; i < project.potentialFreelancers.length; i++) {
            (bool freelancerRefundSuccess, ) = payable(
                project.potentialFreelancers[i]
            ).call{value: verificationFee}("");
            require(freelancerRefundSuccess, "Refund to freelancer failed");
        }

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
            if (projects[i].selectedFreelancer == _freelancer) {
                totalCount++;
            }
        }

        Project[] memory result = new Project[](totalCount);
        uint256 index = 0;

        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].selectedFreelancer == _freelancer) {
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

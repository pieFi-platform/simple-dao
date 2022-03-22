// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./DaoStorage.sol";

contract Dao{

    DaoStorage internal state;

    constructor(string memory _daoName, address _topicAddress, address _owner) {
        state.daoName = _daoName;
        state.topicAddress = _topicAddress;
        state.owner = hash(_owner);
        state.maxUsers = 100000;
        state.users[state.owner] = AccessType.Officer;
        state.userCount++;
    }

    function getMaxUsers() external view returns(uint32) {
        return state.maxUsers;
    }

    function getTopicAddress() external view returns(address) {
        return state.topicAddress;
    }

    function getDaoName() external view returns(string memory) {
        return state.daoName;
    }

    function getUserCount() external view returns(uint32) {
        return state.userCount;
    }

    function setMaxUsers(uint32 _maxUsers) external onlyOwner(){
        state.maxUsers = _maxUsers;
    }

    function getUser(address _user) external view returns(AccessType) {
        return state.users[hash(_user)];
    }

    function addUser(address[] memory _user, AccessType _type) public userCountCheck(_user.length){
        AccessType senderType = state.users[hash(msg.sender)];

        // Verify sender's authorization to grant provided access type
        if (_type == AccessType.Officer) {
            require(senderType == AccessType.Officer, "Not authorized to grant");
        } else {
            require(_type < senderType, "Not authorized to grant");
        }
        uint userLen = _user.length;
        for (uint i=0; i<userLen; i++) {
            bytes32 userHash = hash(_user[i]);
            AccessType userType = state.users[userHash];

            // Verify sender has authorization to update user's access
            require(userType < senderType, "Not authorized to change access");

            state.users[userHash] = _type;
            state.userCount++;
        }
    }

    function removeUser(address[] memory _user) public {
        bytes32 senderHash = hash(msg.sender);
        uint userLen = _user.length;
        for (uint i=0; i<userLen; i++) {
            bytes32 userHash = hash(_user[i]);
            AccessType userType = state.users[userHash];

            // Verify sender's authorization to remove provided access type
            if (userType == AccessType.None) {
                revert("Not a user");
            } else {
                require(state.users[senderHash] > userType, "Not authorized to remove user");
            } 
            
            delete state.users[userHash];
            state.userCount--;
        }
    }

    function removeOfficer(address _officer) external onlyOwner() {
        delete state.users[hash(_officer)];
        state.userCount--;
    }

    function hash(address addr) internal pure returns (bytes32) {
        return keccak256(abi.encode(addr));
    }
    
    modifier userCountCheck(uint count) {
        require((state.userCount + count) <= state.maxUsers, 'Max Users Exceeded');
        _;
    }

    modifier onlyOwner() {
        require(state.owner == hash(msg.sender), 'Only owner is allowed');
        _;
    }
}
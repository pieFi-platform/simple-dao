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

    /// Queries the current max user limit of the dao
    /// @return uint32 the current max users limit state value
    function getMaxUsers() external view returns(uint32) {
        return state.maxUsers;
    }

    /// Queries the Topic address attached to the dao
    /// @return address the current Topic address state value
    function getTopicAddress() external view returns(address) {
        return state.topicAddress;
    }

    /// Queries name attached to the dao
    /// @return string the dao's name
    function getDaoName() external view returns(string memory) {
        return state.daoName;
    }

    /// Queries the current number of users in the dao
    /// @return uint32 the current number of users in the dao
    function getUserCount() external view returns(uint32) {
        return state.userCount;
    }

    /// Queries the dao for a given user and returns the user's access to the dao
    /// @param _user the address of the user whose access is being queried
    /// @return AccessType an enum value indicating the access level of the user
    function getUser(address _user) external view returns(AccessType) {
        return state.users[hash(_user)];
    }

    /// Queries the current Hbar balance of the dao
    /// @return uint the current balance of the dao
    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    /// Allows only the owner to update the max users allowed in the dao
    /// @param _maxUsers the new max user amount
    function setMaxUsers(uint32 _maxUsers) external onlyOwner(){
        state.maxUsers = _maxUsers;
    }

    /// Allows any address to send Hbar to the dao
    function deposit() public payable {}


    /// Allows only officers to transfer Hbar out of the dao to the specified account address
    /// @param _to the address to which the Hbar will be sent
    /// @param _amount the amount of Hbar to be sent
    function transfer(address payable _to, uint _amount) public {
        require(state.users[hash(msg.sender)] == AccessType.Officer, "Only Officers can transfer");
        _to.transfer(_amount);
    }


    /// Grants a list of accounts access to the dao
    ///         Grant Access:
    ///         Officers - Officers, Admins and Members
    ///         Admins - Members
    ///         Members - None
    /// @param _user an array of account address to be added as users of the dao
    /// @param _type an enum specifying the type of access the new users will have
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

    /// Removes Dao access for a list of accounts
    ///         Removal Access:
    ///         Officers - Admins and Members
    ///         Admins - Members
    ///         Members - None
    /// @param _user an array of account address to be removed as users from the dao
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

    /// Removes an officer from the dao
    ///         Removal Access:
    ///         Owner - Officer
    /// @param _officer address of the officer being removed
    function removeOfficer(address _officer) external onlyOwner() {
        delete state.users[hash(_officer)];
        state.userCount--;
    }

    /// Runs the provided solidity address through a keccak256 hash
    /// @param addr address to be hashed
    /// @return bytes32 the resulting 32 byte hash of the address
    function hash(address addr) internal pure returns (bytes32) {
        return keccak256(abi.encode(addr));
    }
    
    /// Verifies the proposed new user count will be within the max user limit
    /// @param count number of users being added
    modifier userCountCheck(uint count) {
        require((state.userCount + count) <= state.maxUsers, 'Max Users Exceeded');
        _;
    }

    /// Verifies that only an owner can perform a certain function
    modifier onlyOwner() {
        require(state.owner == hash(msg.sender), 'Only owner is allowed');
        _;
    }
}
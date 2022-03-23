// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./Dao.sol";
import "./DaoStorage.sol";

contract DaoProxy{

    DaoStorage internal state;

    // Additional state variables go below here
    Dao private daoAddress;

    constructor(string memory _daoName, address _topicAddress, address _owner, Dao _daoAddress) {
        state.daoName = _daoName;
        state.topicAddress = _topicAddress;
        state.owner = hash(_owner);
        state.maxUsers = 100000;
        state.users[state.owner] = AccessType.Officer;
        state.userCount++;

        daoAddress = _daoAddress;
    }

    event DelegateCallEvent(bool success, bytes result);

    // function delegateCallAddUser(bytes4 _selector, address[] memory _addresses, AccessType _type) private {
    //     (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(_selector, _addresses, _type));
    //     emit DelegateCallEvent(success, result);
    // }

    // function delegateCallRemoveUser(bytes4 _selector, address[] memory _addresses) private {
    //     (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(_selector, _addresses));
    //     emit DelegateCallEvent(success, result);
    // }

    // function delegateCallWithAddress(bytes4 _selector, address _address) private {
    //     (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(_selector, _address));
    //     emit DelegateCallEvent(success, result);
    // }

    // function delegateCallWithUint(bytes4 _selector, uint32 _amount) private {
    //     (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(_selector, _amount));
    //     emit DelegateCallEvent(success, result);
    // }

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
        // delegateCallWithUint(Dao.setMaxUsers.selector, _maxUsers);
        (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(Dao.setMaxUsers.selector, _maxUsers));
        emit DelegateCallEvent(success, result);
    }

    function getUser(address _user) external view returns(AccessType) {
        return state.users[hash(_user)];
    }

    function addUser(address[] memory _user, AccessType _type) public userCountCheck(_user.length){
        // AccessType senderType = state.users[hash(msg.sender)];

        // // Verify sender's authorization to grant provided access type
        // if (_type == AccessType.Officer) {
        //     require(senderType == AccessType.Officer, "Not authorized to grant");
        // } else {
        //     require(_type < senderType, "Not authorized to grant");
        // }
        // uint userLen = _user.length;
        // for (uint i=0; i<userLen; i++) {
        //     bytes32 userHash = hash(_user[i]);
        //     AccessType userType = state.users[userHash];

        //     // Verify sender has authorization to update user's access
        //     require(userType < senderType, "Not authorized to change access");

        //     state.users[userHash] = _type;
        //     state.userCount++;
        // }
        // delegateCallAddUser(Dao.addUser.selector, _user, _type);
        (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(Dao.addUser.selector, _user, _type));
        emit DelegateCallEvent(success, result);
    }

    function removeUser(address[] memory _user) public {
        // bytes32 senderHash = hash(msg.sender);
        // uint userLen = _user.length;
        // for (uint i=0; i<userLen; i++) {
        //     bytes32 userHash = hash(_user[i]);
        //     AccessType userType = state.users[userHash];

        //     // Verify sender's authorization to remove provided access type
        //     if (userType == AccessType.None) {
        //         revert("Not a user");
        //     } else {
        //         require(state.users[senderHash] > userType, "Not authorized to remove user");
        //     } 
            
        //     delete state.users[userHash];
        //     state.userCount--;
        // }
        // delegateCallRemoveUser(Dao.removeUser.selector, _user);
        (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(Dao.removeUser.selector, _user));
        emit DelegateCallEvent(success, result);
    }

    function removeOfficer(address _officer) external onlyOwner() {
        // delete state.users[hash(_officer)];
        // state.userCount--;
        // delegateCallWithAddress(Dao.removeOfficer.selector, _officer);
        (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(Dao.removeOfficer.selector, _officer));
        emit DelegateCallEvent(success, result);
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
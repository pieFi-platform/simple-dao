// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./hip-206/HederaTokenService.sol";
import "./hip-206/HederaResponseCodes.sol";
import "./Dao.sol";
import "./Storage.sol";

contract DaoProxy is HederaTokenService{
    Storage internal s;

    // Additional state variables go below here
    Dao private daoAddress;

    constructor(address _officerTokenAddress, address _adminTokenAddress, address _memberTokenAddress, address _treasury, Dao _daoAddress) {
        s.officerTokenAddress = _officerTokenAddress;
        s.adminTokenAddress = _adminTokenAddress;
        s.memberTokenAddress = _memberTokenAddress;

        s.treasury = _treasury;

        s.officers[_treasury] = true;
        s.admins[_treasury] = true;
        s.members[_treasury] = true;

        daoAddress = _daoAddress;
    }

    event DelegateCallEvent(bool success, bytes result);
    event TestStr(string, string);
    event TestAddr(string, address);

    function getSender() public view returns(address){
        return msg.sender;
    }

    function getTreasury() public view returns(address){
        return s.treasury;
    }

    function delegateGetSender() public returns(bytes memory){
        (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(Dao.getSender.selector));
        emit DelegateCallEvent(success, result);
        return result;
    }

    function delegateGetTreasury() public returns(bytes memory){
        (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(Dao.getTreasury.selector));
        emit DelegateCallEvent(success, result);
        return result;
    }

    function testNoParam() public returns(string memory){
        string memory str = "Test Proxy";
        emit TestStr("Proxy", str);
        return str;
    }

    function testWithParam(string memory _param) public returns(string memory){
        emit TestStr("Proxy", _param);
        return _param;
    }

    function testAssociate(address _receiver) public returns(address){
        delegateCallWithAddress(Dao.testAssociate.selector, _receiver);
        emit TestAddr("Proxy", _receiver);
        return _receiver;
    }

    function testTransfer(address _receiver) public returns(address){
        delegateCallWithAddress(Dao.testTransfer.selector, _receiver);
        emit TestAddr("Proxy", _receiver);
        return _receiver;
    }

    function testAddAdmin(address _receiver) public returns(address){
        delegateCallWithAddress(Dao.testAddAdmin.selector, _receiver);
        emit TestAddr("Proxy", _receiver);
        return _receiver;
    }

    function delegateCallWithAddress(bytes4 _selector, address _address) private {
        (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(_selector, _address));
        emit DelegateCallEvent(success, result);
    }

    function delegateCallWithNumber(bytes4 _selector, uint256 _amount) private {
        (bool success, bytes memory result) = address(daoAddress).delegatecall(abi.encodeWithSelector(_selector, _amount));
        emit DelegateCallEvent(success, result);
    }

    function addOfficer(address _receiver) public onlyOfficer(){
        // //Associate receiver account
        // int responseAssociate = HederaTokenService.associateToken(_receiver, officerTokenAddress);

        // if (responseAssociate != HederaResponseCodes.SUCCESS) {
        //     revert ("Officer Associate Failed");
        // }
        
        // //Transfer token to receiver
        // int responseTransfer = HederaTokenService.transferToken(officerTokenAddress, treasury, _receiver, 1);
    
        // if (responseTransfer != HederaResponseCodes.SUCCESS) {
        //     revert ("Officer Transfer Failed");
        // }
        // officers[_receiver] = true;
        delegateCallWithAddress(Dao.addOfficer.selector, _receiver);
    }

    function addAdmin(address _receiver) public onlyOfficer(){
        // //Associate receiver account
        // int responseAssociate = HederaTokenService.associateToken(_receiver, adminTokenAddress);

        // if (responseAssociate != HederaResponseCodes.SUCCESS) {
        //     revert ("Admin Associate Failed");
        // }
        
        // //Transfer token to receiver
        // int responseTransfer = HederaTokenService.transferToken(adminTokenAddress, treasury, _receiver, 1);

        // if (responseTransfer != HederaResponseCodes.SUCCESS) {
        //     revert ("Admin Transfer Failed");
        // }
        // admins[_receiver] = true;
        delegateCallWithAddress(Dao.addAdmin.selector, _receiver);
    }

    function addMember(address _receiver) public onlyAdminOrOfficer(){
        // //Associate receiver account
        // int responseAssociate = HederaTokenService.associateToken(_receiver, memberTokenAddress);

        // if (responseAssociate != HederaResponseCodes.SUCCESS) {
        //     revert ("Member Associate Failed");
        // }
        
        // //Transfer token to receiver
        // int responseTransfer = HederaTokenService.transferToken(memberTokenAddress, treasury, _receiver, 1);

        // if (responseTransfer != HederaResponseCodes.SUCCESS) {
        //     revert ("Member Transfer Failed");
        // }
        // members[_receiver] = true;
        delegateCallWithAddress(Dao.addMember.selector, _receiver);
    }

    function removeMember(address _member) public onlyAdminOrOfficer(){
        // //Transfer token back to treasury
        // int responseTransfer = HederaTokenService.transferToken(memberTokenAddress, _member, treasury, 1);

        // if (responseTransfer != HederaResponseCodes.SUCCESS) {
        //     revert ("Member Transfer Failed");
        // }

        // //Dissociate member account
        // int responseDissociate = HederaTokenService.dissociateToken(_member, memberTokenAddress);

        // if (responseDissociate != HederaResponseCodes.SUCCESS) {
        //     revert ("Member Dissociate Failed");
        // }
        
        // delete members[_member];
        delegateCallWithAddress(Dao.removeMember.selector, _member);
    }

    function removeAdmin(address _admin) public onlyOfficer(){
        // //Transfer token back to treasury
        // int responseTransfer = HederaTokenService.transferToken(adminTokenAddress, _admin, treasury, 1);

        // if (responseTransfer != HederaResponseCodes.SUCCESS) {
        //     revert ("Admin Transfer Failed");
        // }

        // //Dissociate admin account
        // int responseDissociate = HederaTokenService.dissociateToken(_admin, adminTokenAddress);

        // if (responseDissociate != HederaResponseCodes.SUCCESS) {
        //     revert ("admin Dissociate Failed");
        // }
        
        // delete admins[_admin];
        delegateCallWithAddress(Dao.removeAdmin.selector, _admin);
    }

    function mintOfficerTokens(uint64 _amount) external {
        // (
        //     int256 response,
        //     uint64 newTotalSupply,
        //     int64[] memory serialNumbers
        // ) = HederaTokenService.mintToken(officerTokenAddress, _amount, new bytes[](0));

        // if (response != HederaResponseCodes.SUCCESS) {
        //     revert("Officer Mint Failed");
        // }
        delegateCallWithNumber(Dao.mintOfficerTokens.selector, _amount);
    }

    function mintAdminTokens(uint64 _amount) external {
        // (
        //     int256 response,
        //     uint64 newTotalSupply,
        //     int64[] memory serialNumbers
        // ) = HederaTokenService.mintToken(adminTokenAddress, _amount, new bytes[](0));

        // if (response != HederaResponseCodes.SUCCESS) {
        //     revert("Admin Mint Failed");
        // }
        delegateCallWithNumber(Dao.mintAdminTokens.selector, _amount);
    }

    function mintMemberTokens(uint64 _amount) external {
        // (
        //     int256 response,
        //     uint64 newTotalSupply,
        //     int64[] memory serialNumbers
        // ) = HederaTokenService.mintToken(memberTokenAddress, _amount, new bytes[](0));

        // if (response != HederaResponseCodes.SUCCESS) {
        //     revert("Member Mint Failed");
        // }
        delegateCallWithNumber(Dao.mintMemberTokens.selector, _amount);
    }

    modifier onlyOfficer() {
        require(s.officers[msg.sender] == true, 'Only an Officer can perform this function');
        _;
    }
    modifier onlyAdminOrOfficer() {
        require(s.admins[msg.sender] == true || s.officers[msg.sender] == true, 'Only an Officer or an Admin can perform this function');
        _;
    }
    
}
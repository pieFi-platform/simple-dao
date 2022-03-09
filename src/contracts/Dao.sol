// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./hip-206/HederaTokenService.sol";
import "./hip-206/HederaResponseCodes.sol";
import "./Storage.sol";

contract Dao is HederaTokenService{
    Storage internal s;

    constructor(address _officerTokenAddress, address _adminTokenAddress, address _memberTokenAddress) {
        s.officerTokenAddress = _officerTokenAddress;
        s.adminTokenAddress = _adminTokenAddress;
        s.memberTokenAddress = _memberTokenAddress;

        s.treasury = msg.sender;

        s.officers[msg.sender] = true;
        s.admins[msg.sender] = true;
        s.members[msg.sender] = true;

    }

    event MintToken(address tokenAddress, int256 response, uint64 newTotalSupply);
    event Test(string);

    function testOnly() public returns(string memory){
        string memory str = "Test";
        emit Test(str);
        return str;
    }

    function addOfficer(address _receiver) public onlyOfficer(){
        //Associate receiver account
        int responseAssociate = HederaTokenService.associateToken(_receiver, s.officerTokenAddress);

        if (responseAssociate != HederaResponseCodes.SUCCESS) {
            revert ("Officer Associate Failed");
        }
        
        //Transfer token to receiver
        int responseTransfer = HederaTokenService.transferToken(s.officerTokenAddress, s.treasury, _receiver, 1);
    
        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Officer Transfer Failed");
        }
        s.officers[_receiver] = true;
    }

    function addAdmin(address _receiver) public onlyOfficer(){
        //Associate receiver account
        int responseAssociate = HederaTokenService.associateToken(_receiver, s.adminTokenAddress);

        if (responseAssociate != HederaResponseCodes.SUCCESS) {
            revert ("Admin Associate Failed");
        }
        
        //Transfer token to receiver
        int responseTransfer = HederaTokenService.transferToken(s.adminTokenAddress, s.treasury, _receiver, 1);

        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Admin Transfer Failed");
        }
        s.admins[_receiver] = true;
    }

    function addMember(address _receiver) public onlyAdminOrOfficer(){
        //Associate receiver account
        int responseAssociate = HederaTokenService.associateToken(_receiver, s.memberTokenAddress);

        if (responseAssociate != HederaResponseCodes.SUCCESS) {
            revert ("Member Associate Failed");
        }
        
        //Transfer token to receiver
        int responseTransfer = HederaTokenService.transferToken(s.memberTokenAddress, s.treasury, _receiver, 1);

        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Member Transfer Failed");
        }
        s.members[_receiver] = true;
    }

    function removeMember(address _member) public onlyAdminOrOfficer(){
        //Transfer token back to treasury
        int responseTransfer = HederaTokenService.transferToken(s.memberTokenAddress, _member, s.treasury, 1);

        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Member Transfer Failed");
        }

        //Dissociate member account
        int responseDissociate = HederaTokenService.dissociateToken(_member, s.memberTokenAddress);

        if (responseDissociate != HederaResponseCodes.SUCCESS) {
            revert ("Member Dissociate Failed");
        }
        
        delete s.members[_member];
    }

    function removeAdmin(address _admin) public onlyOfficer(){
        //Transfer token back to treasury
        int responseTransfer = HederaTokenService.transferToken(s.adminTokenAddress, _admin, s.treasury, 1);

        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Admin Transfer Failed");
        }

        //Dissociate admin account
        int responseDissociate = HederaTokenService.dissociateToken(_admin, s.adminTokenAddress);

        if (responseDissociate != HederaResponseCodes.SUCCESS) {
            revert ("admin Dissociate Failed");
        }
        
        delete s.admins[_admin];
    }

    function mintOfficerTokens(uint64 _amount) external {
        (
            int256 response,
            uint64 newTotalSupply,
            //int64[] memory serialNumbers
        ) = HederaTokenService.mintToken(s.officerTokenAddress, _amount, new bytes[](0));

        emit MintToken(s.officerTokenAddress, response, newTotalSupply);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Officer Mint Failed");
        }
    }

    function mintAdminTokens(uint64 _amount) external {
        (
            int256 response,
            uint64 newTotalSupply,
            //int64[] memory serialNumbers
        ) = HederaTokenService.mintToken(s.adminTokenAddress, _amount, new bytes[](0));

        emit MintToken(s.adminTokenAddress, response, newTotalSupply);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Admin Mint Failed");
        }
    }

    function mintMemberTokens(uint64 _amount) external {
        (
            int256 response,
            uint64 newTotalSupply,
            //int64[] memory serialNumbers
        ) = HederaTokenService.mintToken(s.memberTokenAddress, _amount, new bytes[](0));

        emit MintToken(s.memberTokenAddress, response, newTotalSupply);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Member Mint Failed");
        }
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
// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./hip-206/HederaTokenService.sol";
import "./hip-206/HederaResponseCodes.sol";

contract Dao is HederaTokenService{
    address officerTokenAddress;
    address adminTokenAddress;
    address memberTokenAddress;

    address treasury;

    mapping(address => bool) officers;
    mapping(address => bool) admins;
    mapping(address => bool) members;


    constructor(address _officerTokenAddress, address _adminTokenAddress, address _memberTokenAddress) {
        officerTokenAddress = _officerTokenAddress;
        adminTokenAddress = _adminTokenAddress;
        memberTokenAddress = _memberTokenAddress;

        treasury = msg.sender;

        officers[msg.sender] = true;
        admins[msg.sender] = true;
        members[msg.sender] = true;

    }

    event MintToken(address tokenAddress, int256 response, uint64 newTotalSupply);

    function addOfficer(address _receiver) public onlyOfficer(){
        //Associate receiver account
        int responseAssociate = HederaTokenService.associateToken(_receiver, officerTokenAddress);

        if (responseAssociate != HederaResponseCodes.SUCCESS) {
            revert ("Officer Associate Failed");
        }
        
        //Transfer token to receiver
        int responseTransfer = HederaTokenService.transferToken(officerTokenAddress, treasury, _receiver, 1);
    
        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Officer Transfer Failed");
        }
        officers[_receiver] = true;
    }

    function addAdmin(address _receiver) public onlyOfficer(){
        //Associate receiver account
        int responseAssociate = HederaTokenService.associateToken(_receiver, adminTokenAddress);

        if (responseAssociate != HederaResponseCodes.SUCCESS) {
            revert ("Admin Associate Failed");
        }
        
        //Transfer token to receiver
        int responseTransfer = HederaTokenService.transferToken(adminTokenAddress, treasury, _receiver, 1);

        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Admin Transfer Failed");
        }
        admins[_receiver] = true;
    }

    function addMember(address _receiver) public onlyAdminOrOfficer(){
        //Associate receiver account
        int responseAssociate = HederaTokenService.associateToken(_receiver, memberTokenAddress);

        if (responseAssociate != HederaResponseCodes.SUCCESS) {
            revert ("Member Associate Failed");
        }
        
        //Transfer token to receiver
        int responseTransfer = HederaTokenService.transferToken(memberTokenAddress, treasury, _receiver, 1);

        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Member Transfer Failed");
        }
        members[_receiver] = true;
    }

    function removeMember(address _member) public onlyAdminOrOfficer(){
        //Transfer token back to treasury
        int responseTransfer = HederaTokenService.transferToken(memberTokenAddress, _member, treasury, 1);

        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Member Transfer Failed");
        }

        //Dissociate member account
        int responseDissociate = HederaTokenService.dissociateToken(_member, memberTokenAddress);

        if (responseDissociate != HederaResponseCodes.SUCCESS) {
            revert ("Member Dissociate Failed");
        }
        
        delete members[_member];
    }

    function removeAdmin(address _admin) public onlyOfficer(){
        //Transfer token back to treasury
        int responseTransfer = HederaTokenService.transferToken(adminTokenAddress, _admin, treasury, 1);

        if (responseTransfer != HederaResponseCodes.SUCCESS) {
            revert ("Admin Transfer Failed");
        }

        //Dissociate admin account
        int responseDissociate = HederaTokenService.dissociateToken(_admin, adminTokenAddress);

        if (responseDissociate != HederaResponseCodes.SUCCESS) {
            revert ("admin Dissociate Failed");
        }
        
        delete admins[_admin];
    }

    function mintOfficerTokens(uint64 _amount) external {
        (
            int256 response,
            uint64 newTotalSupply,
            //int64[] memory serialNumbers
        ) = HederaTokenService.mintToken(officerTokenAddress, _amount, new bytes[](0));

        emit MintToken(officerTokenAddress, response, newTotalSupply);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Officer Mint Failed");
        }
    }

    function mintAdminTokens(uint64 _amount) external {
        (
            int256 response,
            uint64 newTotalSupply,
            //int64[] memory serialNumbers
        ) = HederaTokenService.mintToken(adminTokenAddress, _amount, new bytes[](0));

        emit MintToken(adminTokenAddress, response, newTotalSupply);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Admin Mint Failed");
        }
    }

    function mintMemberTokens(uint64 _amount) external {
        (
            int256 response,
            uint64 newTotalSupply,
            //int64[] memory serialNumbers
        ) = HederaTokenService.mintToken(memberTokenAddress, _amount, new bytes[](0));

        emit MintToken(memberTokenAddress, response, newTotalSupply);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Member Mint Failed");
        }
    }

    modifier onlyOfficer() {
        require(officers[msg.sender] == true, 'Only an Officer can perform this function');
        _;
    }
    modifier onlyAdminOrOfficer() {
        require(admins[msg.sender] == true || officers[msg.sender] == true, 'Only an Officer or an Admin can perform this function');
        _;
    }
    
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import "./test.sol";
import "../contracts/Dao.sol";
import "../contracts/DaoContract.sol";

interface CheatCodes {
  function prank(address) external;
  function expectRevert(bytes calldata) external;
}

string constant NullString = "";
bytes constant NullBytes = "";
address constant NullAddress = address(0);

contract DaoTest is DSTest {
    CheatCodes cheats = CheatCodes(HEVM_ADDRESS);
    Dao dao;

    string public gDaoName = "MyDao";
    address public gTopicAddress = 0x0000000000000000000000000000000000012345;
    uint32 public gMaxUsers = 100000;
    uint256 gBatchSize = 1000;
    uint32 gAccessUpdateAuthIdentifier = 0x853d9ed4;
    uint32 gRemovalAuthIdentifier = 0x04939f12;
    uint32 gNotUserIdentifier = 0x51ef2234;
    address[] public gUsers = [
                        address(0x1), 
                        address(0x2), 
                        address(0x3), 
                        address(0x4), 
                        address(0x5), 
                        address(0x6), 
                        address(0x7), 
                        address(0x8), 
                        address(0x9)];

    receive() external payable { }
    
    function setUp() public {
        dao = new Dao(gDaoName, gTopicAddress, address(this));
    }



    // =================
    // Utility Functions
    // =================
    function CreateErorrCallData(uint32 _identifier, uint256 _arg1) internal pure returns(bytes memory){
        return abi.encodePacked(_identifier, _arg1);
    }

    function CreateErorrCallData(uint32 _identifier, uint256 _arg1, uint256 _arg2) internal pure returns(bytes memory){
        return abi.encodePacked(_identifier, _arg1, _arg2);
    }

    function bytesCmp(bytes memory a, bytes memory b) public pure returns(bool){
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function addAUserNoImpersonateNoRevert(address user, AccessType userLevel) public {
        addAUserNoImpersonate(user, userLevel, NullBytes);
    }
    function addAUserNoImpersonateWithRevert(address user, AccessType userLevel, bytes memory revertMessage) public {
        addAUserNoImpersonate(user, userLevel, revertMessage);
    }
    function addAUserNoImpersonate(address user, AccessType userLevel, bytes memory revertMessage) public {
        addAUser(user, userLevel, NullAddress, revertMessage);
    }

    function addAUserWithImpersonateNoRevert(address user, AccessType userLevel, address impersonateAs) public {
        addAUserWithImpersonate(user, userLevel, impersonateAs, NullBytes);
    }
    function addAUserWithImpersonateWithRevert(address user, AccessType userLevel, address impersonateAs, bytes memory revertMessage) public {
        addAUserWithImpersonate(user, userLevel, impersonateAs, revertMessage);
    }
    function addAUserWithImpersonate(address user, AccessType userLevel, address impersonateAs, bytes memory revertMessage) public {
        addAUser(user, userLevel, impersonateAs, revertMessage);
    }
    function addAUser(address user, AccessType userLevel, address impersonateAs, bytes memory revertMessage) public {
        address[] memory param = new address[](1);
        param[0] = user;

        AccessType origUserLevel = dao.getUser(user);
        bool expectSuccess = true;

        if(impersonateAs != NullAddress){
            cheats.prank(impersonateAs);
        }
        if(!bytesCmp(revertMessage, NullBytes)){
            cheats.expectRevert(bytes(revertMessage));
            expectSuccess = false;
        }
        dao.addUser(param, userLevel);

        if(expectSuccess){
            assertEq(uint(dao.getUser(user)), uint(userLevel));
        } else {
            assertEq(uint(dao.getUser(user)), uint(origUserLevel));
        }
    }


    function removeAUserNoImpersonateNoRevert(address user) public {
        removeAUserNoImpersonate(user, NullBytes);
    }
    function removeAUserNoImpersonateWithRevert(address user, bytes memory revertMessage) public {
        removeAUserNoImpersonate(user, revertMessage);
    }
    function removeAUserNoImpersonate(address user, bytes memory revertMessage) public {
        removeAUser(user, NullAddress, revertMessage);
    }

    function removeAUserWithImpersonateNoRevert(address user, address impersonateAs) public {
        removeAUserWithImpersonate(user, impersonateAs, NullBytes);
    }
    function removeAUserWithImpersonateWithRevert(address user, address impersonateAs, bytes memory revertMessage) public {
        removeAUserWithImpersonate(user, impersonateAs, revertMessage);
    }
    function removeAUserWithImpersonate(address user, address impersonateAs, bytes memory revertMessage) public {
        removeAUser(user, impersonateAs, revertMessage);
    }
    function removeAUser(address user, address impersonateAs, bytes memory revertMessage) public {
        address[] memory param = new address[](1);
        param[0] = user;

        AccessType origUserLevel = dao.getUser(user);
        bool expectSuccess = true;

        if(impersonateAs != NullAddress){
            cheats.prank(impersonateAs);
        }
        if(!bytesCmp(revertMessage, NullBytes)){
            cheats.expectRevert(bytes(revertMessage));
            expectSuccess = false;
        }
        dao.removeUser(param);

        if(expectSuccess){
            assertEq(uint(dao.getUser(user)), uint(0));
        } else {
            assertEq(uint(dao.getUser(user)), uint(origUserLevel));
        }
    }


    function removeUsersNoImpersonateNoRevert(address[] memory users) public {
        removeUsersNoImpersonate(users, NullBytes);
    }
    function removeUsersNoImpersonateWithRevert(address[] memory users, bytes memory revertMessage) public {
        removeUsersNoImpersonate(users, revertMessage);
    }
    function removeUsersNoImpersonate(address[] memory users, bytes memory revertMessage) public {
        removeUsers(users, NullAddress, revertMessage);
    }

    function removeUsersWithImpersonateNoRevert(address[] memory users, address impersonateAs) public {
        removeUsersWithImpersonate(users, impersonateAs, NullBytes);
    }
    function removeUsersWithImpersonateWithRevert(address[] memory users, address impersonateAs, bytes memory revertMessage) public {
        removeUsersWithImpersonate(users, impersonateAs, revertMessage);
    }
    function removeUsersWithImpersonate(address[] memory users, address impersonateAs, bytes memory revertMessage) public {
        removeUsers(users, impersonateAs, revertMessage);
    }
    function removeUsers(address[] memory users, address impersonateAs, bytes memory revertMessage) public {
        AccessType[] memory originalUserLevels = new AccessType[](users.length);
        for (uint i = 0; i < users.length; i++){
            originalUserLevels[i] = dao.getUser(users[i]);
        }

        bool expectSuccess = true;

        if(impersonateAs != NullAddress){
            cheats.prank(impersonateAs);
        }
        if(!bytesCmp(revertMessage, NullBytes)){
            cheats.expectRevert(bytes(revertMessage));
            expectSuccess = false;
        }
        dao.removeUser(users);

        if(expectSuccess){
            for(uint i = 0; i < users.length; i++){
                assertEq(uint(dao.getUser(users[i])), uint(0));
            }
        } else {
            for (uint i = 0; i < users.length; i++){
                assertEq(uint(dao.getUser(users[i])), uint(originalUserLevels[i]));
            }
        }
    }


    function removeAnOfficerNoImpersonateNoRevert(address user) public {
        removeAnOfficerNoImpersonate(user, NullBytes);
    }
    function removeAnOfficerNoImpersonateWithRevert(address user, bytes memory revertMessage) public {
        removeAnOfficerNoImpersonate(user, revertMessage);
    }
    function removeAnOfficerNoImpersonate(address user, bytes memory revertMessage) public {
        removeAnOfficer(user, NullAddress, revertMessage);
    }

    function removeAnOfficerWithImpersonateNoRevert(address user, address impersonateAs) public {
        removeAnOfficerWithImpersonate(user, impersonateAs, NullBytes);
    }
    function removeAnOfficerWithImpersonateWithRevert(address user, address impersonateAs, bytes memory revertMessage) public {
        removeAnOfficerWithImpersonate(user, impersonateAs, revertMessage);
    }
    function removeAnOfficerWithImpersonate(address user, address impersonateAs, bytes memory revertMessage) public {
        removeAnOfficer(user, impersonateAs, revertMessage);
    }
    function removeAnOfficer(address user, address impersonateAs, bytes memory revertMessage) public {
        bool expectSuccess = true;

        AccessType origUserLevel = dao.getUser(user);

        if(impersonateAs != NullAddress){
            cheats.prank(impersonateAs);
        }
        if(!bytesCmp(revertMessage, NullBytes)){
            cheats.expectRevert(bytes(revertMessage));
            expectSuccess = false;
        }
        dao.removeOfficer(user);

        if(expectSuccess){
            assertEq(uint(dao.getUser(user)), uint(0));
        } else {
            assertEq(uint(dao.getUser(user)), uint(origUserLevel));
        }
    }


    function addMaxUsers(bool batched, AccessType level, uint256 batchSize) public {
        uint160 i;
        uint32 batches;

        uint256 numUsersToAdd = gMaxUsers - dao.getUserCount();

        // Force non batched if maxUsers is less than batchSize
        if (gMaxUsers < batchSize){
            batched = false;
        }
        if(batched){
            address[] memory batch = new address[](batchSize);
            // Add users in batches minus the last batch witch may be
            // not a whole batch of batchSize.
            for ( ;i < (numUsersToAdd - numUsersToAdd % batchSize); i++){
                // Add user to batch
                batch[i%batch.length] = address(i);
                // Only send the batch to the contract when its full
                if((i%batch.length) == (batch.length-1)){
                    emit log_named_uint("Batch", batches++);
                    dao.addUser(batch, level);
                }                
            }
        }
        // If batched, now send final batch (not full batch)
        // If non batched, send all users now in a single batch
        if((numUsersToAdd - i) > 0) {
            address[] memory finalBatch = new address[](numUsersToAdd - i);
            for (uint160 j = 0; i < numUsersToAdd; i++)
            {
                finalBatch[j++] = address(i);
            }
            emit log_named_uint("- Batch", batches++);
            dao.addUser(finalBatch, level);
        }
        assertEq(dao.getUserCount(), gMaxUsers);
    }
    // ===================================================

    // ============
    // Test getters
    // ============
    function testGetDaoNameBase() public {
        assertEq(dao.getDaoName(), gDaoName);
    }

    function testGetMaxUsersBase() public {
        assertEq(dao.getMaxUsers(), gMaxUsers);
    }

    function testGetTopicAddressBase() public {
        assertEq(dao.getTopicAddress(), gTopicAddress);
    }

    function testGetUserCountBase() public {
        assertEq(dao.getUserCount(), 1);
    }

    function testGetUserBase() public {
        assertEq(uint(dao.getUser(address(this))), uint(AccessType.Officer));
    }

    function testGetBalance() public {
        assertEq(dao.getBalance(), 0);
    }

    // ============
    // Test setters
    // ============
    function testSetMaxUsers() public {
        uint32 newMaxUsers = 500000;
        dao.setMaxUsers(newMaxUsers);
        assertEq(dao.getMaxUsers(), newMaxUsers);

        dao.setMaxUsers(gMaxUsers);
        assertEq(dao.getMaxUsers(), gMaxUsers);
    }

    function testSetMaxUsersAsNonOwner() public {
        cheats.prank(gUsers[1]);
        cheats.expectRevert('Only owner is allowed');
        dao.setMaxUsers(1234);
    }


    // ==================================
    // Test adding Member user via addUser
    // ==================================    
    function testAddUserMemberAsOwner() public {
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserMemberAsMember() public {
        // Add gUsers[1] as a member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as a member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Member, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserMemberAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as a member
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Member, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }

    function testAddUserMemberAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as a member
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Member, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }


    // ==================================
    // Test adding Admin user via addUser
    // ==================================    
    function testAddUserAdminAsOwner() public {
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserAdminAsMember() public {
        // Add gUsers[1] as an Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Admin
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Admin, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserAdminAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Admin
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Admin, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }

    function testAddUserAdminAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Admin
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Admin, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }


    // ====================================
    // Test adding Officer user via addUser
    // ====================================    
    function testAddUserOfficerAsOwner() public {
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserOfficerAsMember() public {
        // Add gUsers[1] as an Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Officer
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Officer, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserOfficerAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Officer
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Officer, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserOfficerAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Officer
        cheats.prank(gUsers[1]);
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Officer, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }


    // =========================================
    // Test removing Member user via removeUser
    // =========================================    
    function testRemoveUserMemberAsOwner() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1] as owner
        removeAUserNoImpersonateNoRevert(gUsers[1]);
        assertEq(dao.getUserCount(), 1);
    }

    function testRemoveUserMemberAsMember() public {
        // Add gUsers[1] and gUsers[2] as Members
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a member
        removeAUserWithImpersonateWithRevert(gUsers[2], gUsers[1], "Not authorized to remove");
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveUserMemberAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as an Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Admin
        removeAUserWithImpersonateNoRevert(gUsers[2], gUsers[1]);
        assertEq(dao.getUserCount(), 2);
    }

    function testRemoveUserMemberAsOfficer() public {
        // Add gUsers[1] as a Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Officer
        removeAUserWithImpersonateNoRevert(gUsers[2], gUsers[1]);
        assertEq(dao.getUserCount(), 2);
    }


    // =========================================
    // Test removing Admin user via removeUser
    // =========================================
    function testRemoveUserAdminAsOwner() public {
        // Add gUsers[1] as a Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1] as owner
        removeAUserNoImpersonateNoRevert(gUsers[1]);
        assertEq(dao.getUserCount(), 1);
    }

    function testRemoveUserAdminAsMember() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Member
        removeAUserWithImpersonateWithRevert(gUsers[2], gUsers[1], "Not authorized to remove");
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveUserAdminAsAdmin() public {
        // Add gUsers[1] and gUsers[2] as Admins
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Admin
        removeAUserWithImpersonateNoRevert(gUsers[2], gUsers[1]);
        assertEq(dao.getUserCount(), 2);
    }

    function testRemoveUserAdminAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Officer
        removeAUserWithImpersonateNoRevert(gUsers[2], gUsers[1]);
        assertEq(dao.getUserCount(), 2);
    }


    // =========================================
    // Test removing Officer user via removeUser
    // =========================================
    function testRemoveUserOfficerAsOwner() public {
        // Add gUsers[1] as a Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1] as owner
        removeAUserNoImpersonateWithRevert(gUsers[1], CreateErorrCallData(gRemovalAuthIdentifier, uint256(AccessType.Admin), uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 2);
    }

    function testRemoveUserOfficerAsMember() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Member
        removeAUserWithImpersonateWithRevert(gUsers[2], gUsers[1], "Not authorized to remove");
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveUserOfficerAsAdmin() public {
        // Add gUsers[1] as a Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Admin
        removeAUserWithImpersonateWithRevert(gUsers[2], gUsers[1], CreateErorrCallData(gRemovalAuthIdentifier, uint256(AccessType.Officer), uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveUserOfficerAsOfficer() public {
        // Add gUsers[1] and gUsers[2] as Officers
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Officer
        removeAUserWithImpersonateWithRevert(gUsers[2], gUsers[1], CreateErorrCallData(gRemovalAuthIdentifier, uint256(AccessType.Officer), uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 3);
    }


    // ============================================
    // Test removing Officer user via removeOfficer
    // ============================================
    function testRemoveOfficerAsOwner() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1] as the owner
        removeAnOfficerNoImpersonateNoRevert(gUsers[1]);
        assertEq(dao.getUserCount(), 1);
    }

    function testRemoveOfficerAsMember() public {
        // Add gUsers[1] as an Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Member
        removeAnOfficerWithImpersonateWithRevert(gUsers[2], gUsers[1], "Only owner is allowed");
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveOfficerAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Admin
        removeAnOfficerWithImpersonateWithRevert(gUsers[2], gUsers[1], "Only owner is allowed");
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveOfficerAsOfficer() public {
        // Add gUsers[1] and gUsers[2] as Officers
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Officer
        removeAnOfficerWithImpersonateWithRevert(gUsers[2], gUsers[1], "Only owner is allowed");
        assertEq(dao.getUserCount(), 3);
    }


    // ==========================
    // Test Adding MaxUsers Users
    // ==========================
    function testAddMaxUsersAsMemberBatched() public {
        addMaxUsers(true, AccessType.Member, gBatchSize);
    }

    function testAddMaxUsersAsMemberNonBatched() public {
        addMaxUsers(false, AccessType.Member, gBatchSize);
    }

    function testAddMaxUsersAsAdminBatched() public {
        addMaxUsers(true, AccessType.Admin, gBatchSize);
    }

    function testAddMaxUsersAsAdminNonBatched() public {
        addMaxUsers(false, AccessType.Admin, gBatchSize);
    }

    function testAddMaxUsersAsOfficerBatched() public {
        addMaxUsers(true, AccessType.Officer, gBatchSize);
    }

    function testAddMaxUsersAsOfficerNonBatched() public {
        addMaxUsers(false, AccessType.Officer, gBatchSize);
    }


    // ============================
    // Test Adding MaxUsers+1 Users
    // ============================
    function testAddMaxUsersPlusAddMemberBatched() public {
        addMaxUsers(true, AccessType.Member, gBatchSize);
        addAUserNoImpersonateWithRevert(address(uint160(gMaxUsers+1)), AccessType.Member, "Max Users Exceeded");
    }

    function testAddMaxUsersPlusAddMemberNonBatched() public {
        addMaxUsers(false, AccessType.Member, gBatchSize);
        addAUserNoImpersonateWithRevert(address(uint160(gMaxUsers+1)), AccessType.Member, "Max Users Exceeded");
    }

    function testAddMaxUsersPlusAddAdminBatched() public {
        addMaxUsers(true, AccessType.Admin, gBatchSize);
        addAUserNoImpersonateWithRevert(address(uint160(gMaxUsers+1)), AccessType.Admin, "Max Users Exceeded");
    }

    function testAddMaxUsersPlusAddAdminNonBatched() public {
        addMaxUsers(false, AccessType.Admin, gBatchSize);
        addAUserNoImpersonateWithRevert(address(uint160(gMaxUsers+1)), AccessType.Admin, "Max Users Exceeded");
    }

    function testAddMaxUsersPlusAddOfficerBatched() public {
        addMaxUsers(true, AccessType.Officer, gBatchSize);
        addAUserNoImpersonateWithRevert(address(uint160(gMaxUsers+1)), AccessType.Officer, "Max Users Exceeded");
    }

    function testAddMaxUsersPlusAddOfficerNonBatched() public {
        addMaxUsers(false, AccessType.Officer, gBatchSize);
        addAUserNoImpersonateWithRevert(address(uint160(gMaxUsers+1)), AccessType.Officer, "Max Users Exceeded");
    }


    // ===============================
    // Test Adding a Member user twice
    // ===============================
    function testAddUserTwiceMemberAsOwner() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        assertEq(dao.getUserCount(), 2);

        // Try to add gUsers[1] again as a member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserTwiceMemberAsMember() public {
        // Add gUsers[1] and gUsers[2] as Members
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Have gUsers[1] try to add gUsers[2] again as a member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Member, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testAddUserTwiceMemberAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Have gUsers[1] try to add gUsers[2] again as a member
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Member, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }

    function testAddUserTwiceMemberAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Have gUsers[1] try to add gUsers[2] again as a member
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Member, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }


    // ===============================
    // Test Adding an Admin user twice
    // ===============================
    function testAddUserTwiceAdminAsOwner() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        assertEq(dao.getUserCount(), 2);

        // Try to add gUsers[1] again as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserTwiceAdminAsMember() public {
        // Add gUsers[1] and gUsers[2] as Members
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Have gUsers[1] try to add gUsers[2] again as a member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Admin, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testAddUserTwiceAdminAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Have gUsers[1] try to add gUsers[2] again as a Admin
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Admin, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }

    function testAddUserTwiceAdminAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as a Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Have gUsers[1] try to add gUsers[2] again as a Admin
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Admin, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }


    // =================================
    // Test Adding an Officer user twice
    // =================================
    function testAddUserTwiceOfficerAsOwner() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        assertEq(dao.getUserCount(), 2);

        // Try to add gUsers[1] again as an Officer
        addAUserNoImpersonateWithRevert(gUsers[1], AccessType.Officer, CreateErorrCallData(gAccessUpdateAuthIdentifier, uint256(AccessType.Admin), uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserTwiceOfficerAsMember() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Have gUsers[1] try to add gUsers[2] again as a Member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Officer, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testAddUserTwiceOfficerAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Have gUsers[1] try to add gUsers[2] again as an Officer
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Officer, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testAddUserTwiceOfficerAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Have gUsers[1] try to add gUsers[2] again as an Officer
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Officer, gUsers[1], CreateErorrCallData(gAccessUpdateAuthIdentifier, uint256(AccessType.Officer), uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 3);
    }


    // =================================
    // Test Removing a Member user twice
    // =================================
    function testRemoveUserTwiceMemberAsOwner() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1]
        removeAUserNoImpersonateNoRevert(gUsers[1]);
        assertEq(dao.getUserCount(), 1);
        // Try again and expect failure
        removeAUserNoImpersonateWithRevert(gUsers[1], CreateErorrCallData(gNotUserIdentifier, uint256(AccessType.Admin)));
        assertEq(dao.getUserCount(), 1);
    }

    function testRemoveUserTwiceMemberAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Admin
        removeAUserWithImpersonateNoRevert(gUsers[2], gUsers[1]);
        assertEq(dao.getUserCount(), 2);
        // Try again and expect failure
        removeAUserNoImpersonateWithRevert(gUsers[2], CreateErorrCallData(gNotUserIdentifier, uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 2);
    }

    function testRemoveUserTwiceMemberAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);


        // Remove gUsers[2] as gUsers[1] who is an Officer
        removeAUserWithImpersonateNoRevert(gUsers[2], gUsers[1]);
        assertEq(dao.getUserCount(), 2);
        // Try again and expect failure
        removeAUserNoImpersonateWithRevert(gUsers[2], CreateErorrCallData(gNotUserIdentifier, uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 2);
    }


    // =================================
    // Test Removing an Admin user twice
    // =================================
    function testRemoveUserTwiceAdminAsOwner() public {
        // Add gUsers[1] as a Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1]
        removeAUserNoImpersonateNoRevert(gUsers[1]);
        assertEq(dao.getUserCount(), 1);
        // Try again and expect failure
        removeAUserNoImpersonateWithRevert(gUsers[1], CreateErorrCallData(gNotUserIdentifier, uint256(AccessType.Admin)));
        assertEq(dao.getUserCount(), 1);
    }

    function testRemoveUserTwiceAdminAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Officer
        removeAUserWithImpersonateNoRevert(gUsers[2], gUsers[1]);
        assertEq(dao.getUserCount(), 2);
        // Try again and expect failure
        removeAUserNoImpersonateWithRevert(gUsers[2], CreateErorrCallData(gNotUserIdentifier, uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 2);
    }


    // ===================================
    // Test Removing an Officer user twice
    // ===================================
    function testRemoveOfficerTwiceAsOwner() public {
        // Add gUsers[1] as a Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1]
        removeAnOfficerNoImpersonateNoRevert(gUsers[1]);
        assertEq(dao.getUserCount(), 1);
        // Try again and expect failure
        removeAnOfficerNoImpersonateWithRevert(gUsers[1], "Not an officer");
        assertEq(dao.getUserCount(), 1);
    }


    // ==============================
    // Test Removing users in batches
    // ==============================
    function testRemoveUsersBatched() public {
        for(uint i = 0; i < gUsers.length; i++){
            addAUserNoImpersonateNoRevert(gUsers[i], AccessType.Member);
        }
        assertEq(dao.getUserCount(), 10);

        removeUsersNoImpersonateNoRevert(gUsers);
        assertEq(dao.getUserCount(), 1);
    }

    function testRemoveUsersBatchedNonExistingUser() public {
        address[] memory copy = new address[](gUsers.length);
        for(uint i = 0; i < gUsers.length; i++){
            addAUserNoImpersonateNoRevert(gUsers[i], AccessType.Member);
            copy[i] = gUsers[i];
        }
        assertEq(dao.getUserCount(), 10);

        copy[4] = address(0x12345);

        removeUsersNoImpersonateWithRevert(copy, CreateErorrCallData(gNotUserIdentifier, uint256(uint160(copy[4]))));
        assertEq(dao.getUserCount(), 10);

        copy[4] = gUsers[4];
        copy[0] = address(0x12345);

        removeUsersNoImpersonateWithRevert(copy, CreateErorrCallData(gNotUserIdentifier, uint256(uint160(copy[0]))));
        assertEq(dao.getUserCount(), 10);

        copy[0] = gUsers[0];
        copy[gUsers.length-1] = address(0x12345);

        removeUsersNoImpersonateWithRevert(copy, CreateErorrCallData(gNotUserIdentifier, uint256(uint160(copy[gUsers.length-1]))));
        assertEq(dao.getUserCount(), 10);
    }


    // =================================================
    // Test sending/receiving funds to/from the contract
    // =================================================
    function testDeposit() public {
        assertEq(dao.getBalance(), 0);
        payable(address(dao)).transfer(1);
        assertEq(dao.getBalance(), 1);
        payable(address(dao)).transfer(10);
        assertEq(dao.getBalance(), 11);
    }

    function testWithdrawl() public {
        assertEq(dao.getBalance(), 0);
        payable(address(dao)).transfer(10);
        uint256 bal_before = address(this).balance;
        dao.transferHbar(payable(address(this)), 1);
        assertEq(bal_before, address(this).balance - 1);
    }

    function testWithdrawlRevert() public {
        assertEq(dao.getBalance(), 0);
        cheats.expectRevert("");
        dao.transferHbar(payable(address(this)), 1);
    }


    // ================================
    // Test promoting a Member to Admin
    // ================================
    function testPromoteMemberToAdminAsMember() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Promote gUsers[2] to Admin as gUsers[1] who is a Member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Admin, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testPromoteMemberToAdminAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Promote gUsers[2] to Admin as gUsers[1] who is an Admin
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Admin, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }

    function testPromoteMemberToAdminAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Promote gUsers[2] to Admin as gUsers[1] who is an Officer
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Admin, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }


    // ==================================
    // Test promoting a Member to Officer
    // ==================================    
    function testPromoteMemberToOfficerAsMember() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Promote gUsers[2] to Officer as gUsers[1] who is a Member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Officer, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testPromoteMemberToOfficerAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Promote gUsers[2] to Officer as gUsers[1] who is an Admin
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Officer, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testPromoteMemberToOfficerAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as a Member
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Member);
        assertEq(dao.getUserCount(), 3);

        // Promote gUsers[2] to Officer as gUsers[1] who is an Officer
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Officer, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }


    // ==================================
    // Test promoting an Admin to Officer
    // ==================================    
    function testPromoteAdminToOfficerAsMember() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Promote gUsers[2] to Officer as gUsers[1] who is a Member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Officer, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testPromoteAdminToOfficerAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Promote gUsers[2] to Officer as gUsers[1] who is an Admin
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Officer, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testPromoteAdminToOfficerAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Promote gUsers[2] to Officer as gUsers[1] who is a Member
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Officer, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }


    // =================================
    // Test demoting an Officer to Amdin
    // =================================    
    function testDemoteOfficerToAdminAsMember() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Demote gUsers[2] to Admin as gUsers[1] who is a Member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Admin, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testDemoteOfficerToAdminAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Demote gUsers[2] to Admin as gUsers[1] who is an Admin
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Admin, gUsers[1], CreateErorrCallData(gAccessUpdateAuthIdentifier, uint256(AccessType.Officer), uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 3);
    }

    function testDemoteOfficerToAdminAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Demote gUsers[2] to Admin as gUsers[1] who is an Officer
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Admin, gUsers[1], CreateErorrCallData(gAccessUpdateAuthIdentifier, uint256(AccessType.Officer), uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 3);
    }


    // ==================================
    // Test demoting an Officer to Member
    // ==================================   
    function testDemoteOfficerToMemberAsMember() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Demote gUsers[2] to Member as gUsers[1] who is a Member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Member, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testDemoteOfficerToMemberAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Demote gUsers[2] to Member as gUsers[1] who is an Admin
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Member, gUsers[1], CreateErorrCallData(gAccessUpdateAuthIdentifier, uint256(AccessType.Officer), uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 3);
    }

    function testDemoteOfficerToMemberAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Officer);
        assertEq(dao.getUserCount(), 3);

        // Demote gUsers[2] to Member as gUsers[1] who is an Officer
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Member, gUsers[1], CreateErorrCallData(gAccessUpdateAuthIdentifier, uint256(AccessType.Officer), uint256(AccessType.Officer)));
        assertEq(dao.getUserCount(), 3);
    }


    // ================================
    // Test demoting an Admin to Member
    // ================================   
    function testDemoteAdminToMemberAsMember() public {
        // Add gUsers[1] as a Member
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Member);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Demote gUsers[2] to Member as gUsers[1] who is a Member
        addAUserWithImpersonateWithRevert(gUsers[2], AccessType.Member, gUsers[1], "Not authorized to grant");
        assertEq(dao.getUserCount(), 3);
    }

    function testDemoteAdminToMemberAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Admin);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Demote gUsers[2] to Member as gUsers[1] who is an Admin
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Member, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }

    function testDemoteAdminToMemberAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUserNoImpersonateNoRevert(gUsers[1], AccessType.Officer);
        // Add gUsers[2] as an Admin
        addAUserNoImpersonateNoRevert(gUsers[2], AccessType.Admin);
        assertEq(dao.getUserCount(), 3);

        // Demote gUsers[2] to Member as gUsers[1] who is an Officer
        addAUserWithImpersonateNoRevert(gUsers[2], AccessType.Member, gUsers[1]);
        assertEq(dao.getUserCount(), 3);
    }
}

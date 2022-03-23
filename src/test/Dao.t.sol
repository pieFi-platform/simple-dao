// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import "./test.sol";
import "../contracts/Dao.sol";
import "../contracts/DaoStorage.sol";

interface CheatCodes {
  function prank(address) external;
  function expectRevert(bytes calldata) external;
}

contract DaoTest is DSTest {
    CheatCodes cheats = CheatCodes(HEVM_ADDRESS);
    Dao dao;

    event S(string);
    event U32(uint32);
    event U160(uint160);
    event U256(uint256);
    event A(address);

    string public gDaoName = "MyDao";
    address public gTopicAddress = 0x0000000000000000000000000000000000012345;
    uint32 public gMaxUsers = 100000;
    uint256 gBatchSize = 1000;
    address[] public gUsers = [
                        address(this), 
                        address(0x1), 
                        address(0x2), 
                        address(0x3), 
                        address(0x4), 
                        address(0x5), 
                        address(0x6), 
                        address(0x7), 
                        address(0x8), 
                        address(0x9)];

    function setUp() public {
        dao = new Dao(gDaoName, gTopicAddress, address(this));
    }


    // =================
    // Utility Functions
    // =================
    function addAUser(address user, AccessType level, bool expectSuccess) public {
        address[] memory param = new address[](1);
        param[0] = user;

        dao.addUser(param, level);
        if(expectSuccess){
            assertEq(uint(dao.getUser(user)), uint(level));
        } else {
            assertEq(uint(dao.getUser(user)), uint(0));
        }
    }
    function removeAUser(address user, AccessType level, bool expectSuccess) public {
        address[] memory param = new address[](1);
        param[0] = user;

        dao.removeUser(param);
        if(expectSuccess){
            assertEq(uint(dao.getUser(user)), uint(0));
        } else {
            assertEq(uint(dao.getUser(user)), uint(level));
        }
    }
    function removeAnOfficer(address user, bool expectSuccess) public {
        dao.removeOfficer(user);
        if(expectSuccess){
            assertEq(uint(dao.getUser(user)), uint(0));
        } else {
            assertEq(uint(dao.getUser(user)), uint(AccessType.Officer));
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
        addAUser(gUsers[1], AccessType.Member, true);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserMemberAsMember() public {
        // Add gUsers[1] as a member
        addAUser(gUsers[1], AccessType.Member, true);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as a member
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to grant");
        addAUser(gUsers[2], AccessType.Member, false);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserMemberAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUser(gUsers[1], AccessType.Admin, true);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as a member
        cheats.prank(gUsers[1]);
        addAUser(gUsers[2], AccessType.Member, true);
        assertEq(dao.getUserCount(), 3);
    }

    function testAddUserMemberAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUser(gUsers[1], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as a member
        cheats.prank(gUsers[1]);
        addAUser(gUsers[2], AccessType.Member, true);
        assertEq(dao.getUserCount(), 3);
    }


    // ==================================
    // Test adding Admin user via addUser
    // ==================================    
    function testAddUserAdminAsOwner() public {
        addAUser(gUsers[1], AccessType.Admin, true);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserAdminAsMember() public {
        // Add gUsers[1] as an Member
        addAUser(gUsers[1], AccessType.Member, true);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Admin
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to grant");
        addAUser(gUsers[2], AccessType.Admin, false);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserAdminAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUser(gUsers[1], AccessType.Admin, true);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Admin
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to grant");
        addAUser(gUsers[2], AccessType.Admin, false);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserAdminAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUser(gUsers[1], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Admin
        cheats.prank(gUsers[1]);
        addAUser(gUsers[2], AccessType.Admin, true);
        assertEq(dao.getUserCount(), 3);
    }


    // ====================================
    // Test adding Officer user via addUser
    // ====================================    
    function testAddUserOfficerAsOwner() public {
        addAUser(gUsers[1], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserOfficerAsMember() public {
        // Add gUsers[1] as an Member
        addAUser(gUsers[1], AccessType.Member, true);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Officer
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to grant");
        addAUser(gUsers[2], AccessType.Officer, false);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserOfficerAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUser(gUsers[1], AccessType.Admin, true);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Officer
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to grant");
        addAUser(gUsers[2], AccessType.Officer, false);
        assertEq(dao.getUserCount(), 2);
    }

    function testAddUserOfficerAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUser(gUsers[1], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 2);

        // Have gUsers[1] try to add gUsers[2] as an Officer
        cheats.prank(gUsers[1]);
        addAUser(gUsers[2], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 3);
    }


    // =========================================
    // Test removing Member user via removeUser
    // =========================================    
    function testRemoveUserMemberAsOwner() public {
        // Add gUsers[1] as a Member
        addAUser(gUsers[1], AccessType.Member, true);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1] as owner
        AccessType level = dao.getUser(gUsers[1]);
        removeAUser(gUsers[1], level, true);
        assertEq(dao.getUserCount(), 1);
    }

    function testRemoveUserMemberAsMember() public {
        // Add gUsers[1] and gUsers[2] as Members
        addAUser(gUsers[1], AccessType.Member, true);
        addAUser(gUsers[2], AccessType.Member, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a member
        AccessType level = dao.getUser(gUsers[2]);
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to remove user");
        removeAUser(gUsers[2], level, false);
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveUserMemberAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUser(gUsers[1], AccessType.Admin, true);
        // Add gUsers[2] as an Member
        addAUser(gUsers[2], AccessType.Member, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Admin
        AccessType level = dao.getUser(gUsers[2]);
        cheats.prank(gUsers[1]);
        removeAUser(gUsers[2], level, true);
        assertEq(dao.getUserCount(), 2);
    }

    function testRemoveUserMemberAsOfficer() public {
        // Add gUsers[1] as a Officer
        addAUser(gUsers[1], AccessType.Officer, true);
        // Add gUsers[2] as a Member
        addAUser(gUsers[2], AccessType.Member, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Officer
        AccessType level = dao.getUser(gUsers[2]);
        cheats.prank(gUsers[1]);
        removeAUser(gUsers[2], level, true);
        assertEq(dao.getUserCount(), 2);
    }


    // =========================================
    // Test removing Admin user via removeUser
    // =========================================
    function testRemoveUserAdminAsOwner() public {
        // Add gUsers[1] as a Admin
        addAUser(gUsers[1], AccessType.Admin, true);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1] as owner
        AccessType level = dao.getUser(gUsers[1]);
        removeAUser(gUsers[1], level, true);
        assertEq(dao.getUserCount(), 1);
    }

    function testRemoveUserAdminAsMember() public {
        // Add gUsers[1] as a Member
        addAUser(gUsers[1], AccessType.Member, true);
        // Add gUsers[2] as an Admin
        addAUser(gUsers[2], AccessType.Admin, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Member
        AccessType level = dao.getUser(gUsers[2]);
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to remove user");
        removeAUser(gUsers[2], level, false);
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveUserAdminAsAdmin() public {
        // Add gUsers[1] and gUsers[2] as Admins
        addAUser(gUsers[1], AccessType.Admin, true);
        addAUser(gUsers[2], AccessType.Admin, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Admin
        AccessType level = dao.getUser(gUsers[2]);
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to remove user");
        removeAUser(gUsers[2], level, false);
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveUserAdminAsOfficer() public {
        // Add gUsers[1] as an Officer
        addAUser(gUsers[1], AccessType.Officer, true);
        // Add gUsers[2] as an Admin
        addAUser(gUsers[2], AccessType.Admin, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Officer
        AccessType level = dao.getUser(gUsers[2]);
        cheats.prank(gUsers[1]);
        removeAUser(gUsers[2], level, true);
        assertEq(dao.getUserCount(), 2);
    }


    // =========================================
    // Test removing Officer user via removeUser
    // =========================================
    function testRemoveUserOfficerAsOwner() public {
        // Add gUsers[1] as a Officer
        addAUser(gUsers[1], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1] as owner
        AccessType level = dao.getUser(gUsers[1]);
        cheats.expectRevert("Not authorized to remove user");
        removeAUser(gUsers[1], level, false);
        assertEq(dao.getUserCount(), 2);
    }

    function testRemoveUserOfficerAsMember() public {
        // Add gUsers[1] as a Member
        addAUser(gUsers[1], AccessType.Member, true);
        // Add gUsers[2] as an Officer
        addAUser(gUsers[2], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Member
        AccessType level = dao.getUser(gUsers[2]);
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to remove user");
        removeAUser(gUsers[2], level, false);
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveUserOfficerAsAdmin() public {
        // Add gUsers[1] as a Admin
        addAUser(gUsers[1], AccessType.Admin, true);
        // Add gUsers[2] as an Officer
        addAUser(gUsers[2], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Admin
        AccessType level = dao.getUser(gUsers[2]);
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to remove user");
        removeAUser(gUsers[2], level, false);
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveUserOfficerAsOfficer() public {
        // Add gUsers[1] and gUsers[2] as Officers
        addAUser(gUsers[1], AccessType.Officer, true);
        addAUser(gUsers[2], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Officer
        AccessType level = dao.getUser(gUsers[2]);
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Not authorized to remove user");
        removeAUser(gUsers[2], level, false);
        assertEq(dao.getUserCount(), 3);
    }


    // ============================================
    // Test removing Officer user via removeOfficer
    // ============================================
    function testRemoveOfficerAsOwner() public {
        // Add gUsers[1] as an Officer
        addAUser(gUsers[1], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 2);

        // Remove gUsers[1] as the owner
        removeAnOfficer(gUsers[1], true);
        assertEq(dao.getUserCount(), 1);
    }

    function testRemoveOfficerAsMember() public {
        // Add gUsers[1] as an Member
        addAUser(gUsers[1], AccessType.Member, true);
        // Add gUsers[2] as an Officer
        addAUser(gUsers[2], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is a Member
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Only owner is allowed");
        removeAnOfficer(gUsers[2], false);
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveOfficerAsAdmin() public {
        // Add gUsers[1] as an Admin
        addAUser(gUsers[1], AccessType.Admin, true);
        // Add gUsers[2] as an Officer
        addAUser(gUsers[2], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Admin
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Only owner is allowed");
        removeAnOfficer(gUsers[2], false);
        assertEq(dao.getUserCount(), 3);
    }

    function testRemoveOfficerAsOfficer() public {
        // Add gUsers[1] and gUsers[2] as Officers
        addAUser(gUsers[1], AccessType.Officer, true);
        addAUser(gUsers[2], AccessType.Officer, true);
        assertEq(dao.getUserCount(), 3);

        // Remove gUsers[2] as gUsers[1] who is an Officer
        cheats.prank(gUsers[1]);
        cheats.expectRevert("Only owner is allowed");
        removeAnOfficer(gUsers[2], false);
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
    function testAddMaxUsersPlusAsMemberBatched() public {
        addMaxUsers(true, AccessType.Member, gBatchSize);
        cheats.expectRevert("Max Users Exceeded");
        addAUser(address(uint160(gMaxUsers+1)), AccessType.Member, false);
    }

    function testAddMaxUsersPlusAsMemberNonBatched() public {
        addMaxUsers(false, AccessType.Member, gBatchSize);
        cheats.expectRevert("Max Users Exceeded");
        addAUser(address(uint160(gMaxUsers+1)), AccessType.Member, false);
    }

    function testAddMaxUsersPlusAsAdminBatched() public {
        addMaxUsers(true, AccessType.Admin, gBatchSize);
        cheats.expectRevert("Max Users Exceeded");
        addAUser(address(uint160(gMaxUsers+1)), AccessType.Admin, false);
    }

    function testAddMaxUsersPlusAsAdminNonBatched() public {
        addMaxUsers(false, AccessType.Admin, gBatchSize);
        cheats.expectRevert("Max Users Exceeded");
        addAUser(address(uint160(gMaxUsers+1)), AccessType.Admin, false);
    }

    function testAddMaxUsersPlusAsOfficerBatched() public {
        addMaxUsers(true, AccessType.Officer, gBatchSize);
        cheats.expectRevert("Max Users Exceeded");
        addAUser(address(uint160(gMaxUsers+1)), AccessType.Officer, false);
    }

    function testAddMaxUsersPlusAsOfficerNonBatched() public {
        addMaxUsers(false, AccessType.Officer, gBatchSize);
        cheats.expectRevert("Max Users Exceeded");
        addAUser(address(uint160(gMaxUsers+1)), AccessType.Officer, false);
    }
}

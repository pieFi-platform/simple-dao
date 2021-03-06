// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

uint32 constant MAX_USERS = 100000;

enum AccessType {
    None,
    Member,
    Admin,
    Officer
}

struct DaoStorage {
    // These state variables must remain unchanged
    string daoName;                             //0
    address owner;                              //1
    address topicAddress;                       //2
    uint32 maxUsers;                            //2
    uint32 userCount;                           //2
    mapping(address => AccessType) users;       //3
    // -----------------------------------
}
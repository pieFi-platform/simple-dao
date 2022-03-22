// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

enum AccessType {
    None,
    Member,
    Admin,
    Officer
}

struct DaoStorage {
    // These state variables must remain unchanged
    string daoName;                             //0
    bytes32 owner;                              //1
    address topicAddress;                       //2
    uint32 maxUsers;                            //2
    uint32 userCount;                           //2
    mapping(bytes32 => AccessType) users;       //3
    // -----------------------------------
}
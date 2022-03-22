// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

struct Storage {
    // These state variables must remained unchanged
    address officerTokenAddress;        //0 
    address adminTokenAddress;          //1
    address memberTokenAddress;         //2

    address treasury;                   //3

    mapping(address => bool) officers;  //4
    mapping(address => bool) admins;    //5
    mapping(address => bool) members;   //6
    // -----------------------------------
}
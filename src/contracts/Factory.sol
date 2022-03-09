// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./Dao.sol";
import "./Proxy.sol";

contract Factory{
    // Makes 1st Contract and proxies
    address public impContract;
    mapping (address => bool) public proxies;

    event CreateMainEvent(address _officerTokenAddress, address _adminTokenAddress, address _memberTokenAddress);
    event CreateProxyEvent(address _officerTokenAddress, address _adminTokenAddress, address _memberTokenAddress, Dao _daoAddress);
    event Test(string);

    function testOnly() public returns(string memory){
        string memory str = "Test";
        emit Test(str);
        return str;
    }

    function createImp(address _officerTokenAddress, address _adminTokenAddress, address _memberTokenAddress) public returns(address){
        impContract = address(new Dao(_officerTokenAddress, _adminTokenAddress, _memberTokenAddress));
        emit CreateMainEvent(_officerTokenAddress, _adminTokenAddress, _memberTokenAddress);
        return impContract;
    }

    function createProxy(address _officerTokenAddress, address _adminTokenAddress, address _memberTokenAddress, Dao _impContract) public returns(address){
        address p = address(new DaoProxy(_officerTokenAddress, _adminTokenAddress, _memberTokenAddress, _impContract));
        proxies[p] = true;
        emit CreateProxyEvent(_officerTokenAddress, _adminTokenAddress, _memberTokenAddress, _impContract);
        return p;
    }
}
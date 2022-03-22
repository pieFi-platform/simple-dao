// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./Dao.sol";
import "./DaoProxy.sol";

contract DaoFactory{
    // Makes 1st Contract and proxies
    address public impContract;
    mapping (address => bool) public proxies;

    event CreateImpEvent(string _daoName, address _topicAddress);
    event CreateProxyEvent(string _daoName, address _topicAddress, Dao _daoAddress);
    event Test(string);

    function testOnly() public returns(string memory){
        string memory str = "Test";
        emit Test(str);
        return str;
    }

    function createImp(string _daoName, address _topicAddress) public returns(address){
        impContract = address(new Dao(_daoName, _topicAddress, msg.sender));
        emit CreateImpEvent(_daoName, _topicAddress);
        return impContract;
    }

    function createProxy(string _daoName, address _topicAddress, Dao _impContract) public returns(address){
        address proxyContract = address(new DaoProxy(_daoName, _topicAddress, msg.sender, _impContract));
        proxies[proxyContract] = true;
        emit CreateProxyEvent(_daoName, _topicAddress, _impContract);
        return proxyContract;
    }
}
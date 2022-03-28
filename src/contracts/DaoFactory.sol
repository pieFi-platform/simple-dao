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

    /// Creates the implementation dao contract (only called once)
    /// @param _daoName the name of the dao
    /// @param _topicAddress an address of a topic previously created and attached to the dao
    /// @return address the address of the implementation contract
    function createImp(string memory _daoName, address _topicAddress) public returns(address){
        impContract = address(new Dao(_daoName, _topicAddress, msg.sender));
        emit CreateImpEvent(_daoName, _topicAddress);
        return impContract;
    }

    /// Creates a proxy dao contract
    /// @param _daoName the name of the dao
    /// @param _topicAddress an address of a topic previously created and attached to the dao
    /// @param _impContract the address of the implementation contract
    /// @return address the address of the new proxy contract
    function createProxy(string memory _daoName, address _topicAddress, Dao _impContract) public returns(address){
        address proxyContract = address(new DaoProxy(_daoName, _topicAddress, msg.sender, _impContract));
        proxies[proxyContract] = true;
        emit CreateProxyEvent(_daoName, _topicAddress, _impContract);
        return proxyContract;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract Factory{
    // Makes 1st Contract and proxies
    address mainContract;
    mapping (address => bool) public proxies;

    constructor(){
        
    }

    function createMain(string memory _name) public returns(address){
        mainContract = address(new SimpleDAOImp(_name));
        return mainContract;
    }

    function createProxy(string memory _name) public returns(address){
        address p = address(new SimpleDAOProxy(_name));
        proxies[p] = true;
        return p;
    }
}

contract SimpleDAOImp{
    // Implementation contract for SimpleDAO
    mapping (address => bool) public officers;
    mapping (address => bool) public  members;
    string public DAOName;

    modifier onlyOfficers(){
        require(officers[msg.sender]);
        _;
    }

    constructor(string memory _name){
        DAOName = _name;
        officers[msg.sender] = true;
    }

    function addOfficer(address _newOfficer) public onlyOfficers{
        officers[_newOfficer] = true;
    }

    function addMember(address _newMember) public onlyOfficers{
        members[_newMember] = true;
    }

    function removeMember(address _oldMember) public onlyOfficers{
        delete members[_oldMember];
    }

    function getName() public view returns(string memory){
        return DAOName;
    }
}

contract SimpleDAOProxy{
    // Proxy contract which delegatecall's SimpleDAOImp's funcs
    mapping (address => bool) public officers;
    mapping (address => bool) public  members;
    string public DAOName;

    event AddedOfficerDelegated(address _newOfficer, bool success, bytes result);
    event AddedMemberDelegated(address _newOfficer, bool success, bytes result);
    event RemovedMemberDelegated(address _newOfficer, bool success, bytes result);

    constructor(string memory _name){
        DAOName = _name;
        officers[msg.sender] = true;
    }

    function addOfficerDelegated(address simpleDAOImp, address _newOfficer) public returns(bool) {
        (bool success, bytes memory result) = simpleDAOImp.delegatecall(abi.encodeWithSignature("addOfficer(address)", _newOfficer));
        emit AddedOfficerDelegated(_newOfficer, success, result);
        return success;
    }

    function addMemberDelegated(address simpleDAOImp, address _newMember) public returns(bool) {
        (bool success, bytes memory result) = simpleDAOImp.delegatecall(abi.encodeWithSignature("addMember(address)", _newMember));
        emit AddedMemberDelegated(_newMember, success, result);
        return success;
    }

    function removeMemberDelegated(address simpleDAOImp, address _oldMember) public returns(bool) {
        (bool success, bytes memory result) = simpleDAOImp.delegatecall(abi.encodeWithSignature("addMember(address)", _oldMember));
        emit RemovedMemberDelegated(_oldMember, success, result);
        return success;
    }
}


/* 
    Was able to deploy a Factory, then using createMain and createProxy 
    deploy an Imp and a Proxy. Then I could set the Imp.val/Imp.name using
    Imp.setVal/Imp.setName. AND I was able to set Proxy.val/Proxy.name 
    using Proxy.setValDelegated/Proxy.setNameDelegated.
*/
// pragma solidity ^0.5.8;

// contract Factory{
//     address mainContract;
//     mapping (address => bool) public proxies;
//     address[] public proxyArr;

//     constructor() public {}

//     function createMain(string memory _name) public returns(address){
//         mainContract = address(new Imp(1, _name));
//         return mainContract;
//     }

//     function createProxy(string memory _name) public returns(Proxy){
//         Proxy p = new Proxy(2, _name);
//         proxies[address(p)] = true;
//         proxyArr.push(address(p));
//         return p;
//     }

//     function getMain() public view returns(address){ 
//         return mainContract;
//     }

//     function getProxy(uint256 i) public view returns(address){ 
//         return proxyArr[i];
//     }
// }

// contract Imp{
//     uint256 public val;
//     string public name;

//     constructor(uint256 _val, string memory _name) public {
//         val = _val;
//         name = _name;
//     }

//     function setVal(uint256 _val) public {
//         val = _val;
//     }

//     function setName(string memory _name) public {
//         name = _name;
//     }

//     function getVal() public view returns(uint256){
//         return  val;
//     }

//     function getName() public view returns(string memory){
//         return name;
//     }
// }

// contract Proxy{
//     uint256 public val;
//     string public name;

//     event SetValDelegated(bool success, bytes result);
//     event SetNameDelegated(bool success, bytes result);

//     constructor(uint256 _val, string memory _name)public {
//         val = _val;
//         name = _name;
//     }

//     function setValDelegated(address _imp, uint256 v) public returns (bool) {
//         (bool success, bytes memory result) = _imp.delegatecall(abi.encodeWithSignature("setVal(uint256)", v));
//         emit SetValDelegated(success, result);
//         return success;
//     }

//     function setNameDelegated(address _imp, string memory _name) public returns (bool) {
//         (bool success, bytes memory result) = _imp.delegatecall(abi.encodeWithSignature("setName(string)", _name));
//         emit SetNameDelegated(success, result);
//         return success;
//     }  
// }


// -------------------------------------------------------------------------------------------------------


/*
    Deploy Storage and Calculator. Pass address of Storage when deploying Machine.
    Now, Machine can modify Storage.val by directly callying Storage.setValue().
    Machine can also call addValuesWithCall() which will `call` Calculator.add() and 
    set Calculator's local variables calculateResult and user=address(Machine).
    However, when Machine calls addValuesWithDelegateCall() which will `delegatecall`
    Calculator.add() it will not set Calculator's locals, but Machines instead: 
    Machine.calculateResult and Machine.user=address(caller of Machine, ie the User)
*/
// pragma solidity ^0.5.8;


// contract Machine {
//     uint256 public calculateResult;
    
//     address public user;    
    
//     Storage public s;

//     event AddedValuesByDelegateCall(uint256 a, uint256 b, bool success);
//     event AddedValuesByCall(uint256 a, uint256 b, bool success);

//     constructor(Storage addr) public {
//         s = addr;
//         calculateResult = 0;
//     }
    
//     function saveValue(uint x) public returns (bool) {
//         s.setValue(x);
//         return true;
//     }
//     function getValue() public view returns (uint) {
//         return s.val();
//     }

//     function addValuesWithDelegateCall(address calculator, uint256 a, uint256 b) public returns (uint256) {
//         (bool success, bytes memory result) = calculator.delegatecall(abi.encodeWithSignature("add(uint256,uint256)", a, b));
//         emit AddedValuesByDelegateCall(a, b, success);
//         return abi.decode(result, (uint256));
//     }
    
//     function addValuesWithCall(address calculator, uint256 a, uint256 b) public returns (uint256) {
//         (bool success, bytes memory result) = calculator.call(abi.encodeWithSignature("add(uint256,uint256)", a, b));
//         emit AddedValuesByCall(a, b, success);
//         return abi.decode(result, (uint256));
//     }
// }

// contract Calculator {
//     uint256 public calculateResult;
    
//     address public user;
    
//     event Add(uint256 a, uint256 b);
    
//     function add(uint256 a, uint256 b) public returns (uint256) {
//         calculateResult = a + b;
//         assert(calculateResult >= a);
        
//         emit Add(a, b);
//         user = msg.sender;
        
//         return calculateResult;
//     }
// }

// contract Storage {
//     uint public val;
//     constructor(uint v) public {
//         val = v;
//     }
//     function setValue(uint v) public {
//         val = v;
//     }
// }


// ------------------------------------------------------------------------------


/*
    Deploy Storage first, then pass address to contructor of Machine
    Machine can now call setValue() of Storage contract and set its
    local variable val.
*/

// pragma solidity ^0.5.8;
//
// contract Machine {
//     Storage public s;
//     uint256 public calculateResult;
//     constructor(Storage addr) public {
//         s = addr;
//         calculateResult = 0;
//     }
    
//     function saveValue(uint x) public returns (bool) {
//         s.setValue(x);
//         return true;
//     }
//     function getValue() public view returns (uint) {
//         return s.val();
//     }
// }

// contract Storage {
//     uint public val;
//     constructor(uint v) public {
//         val = v;
//     }
//     function setValue(uint v) public {
//         val = v;
//     }
// }
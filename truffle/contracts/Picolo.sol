pragma solidity ^0.4.2;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./StandardToken.sol";

contract Picolo is Ownable, StandardToken {

  	using SafeMath for uint256;

    // metadata
    string public constant name = "Picolo Token";
    string public constant symbol = "PIC";
    uint256 public constant decimals = 18;
    string public version = "1.0";

   	uint public entryStake = 0.01 ether;  // amount of eth required for staking
   	mapping(address => uint) public registeredNodesStake;
   	mapping(address => string) public nodeStatus;
    uint256 public totalPayments;

   	uint public convictThreshold = 3;
   	mapping(address => uint) public voteTally;
   	mapping(address => uint) public maliciousVoteTally;
   	mapping(address => bool) public validators;

    function Picolo() public {
      totalSupply = 1 * (10**9) * (10 ** decimals);
      balances[msg.sender] = totalSupply;
    }

    // Status of transaction. Used for error handling.

   	event nodeStatusChangeEvent (
   		string newStatus,
   		address sender
   	);

    modifier checkStake() {
        require(msg.value == entryStake);
        _;
    }

    modifier onlyValidators() {
        require(validators[msg.sender]);
        _;
    }

    modifier checkClaim() {
        // to be implemented
        _;
    }

   	function register() public payable checkStake {
      require(keccak256(nodeStatus[msg.sender]) == keccak256(""));
      require(registeredNodesStake[msg.sender] == 0);
      nodeStatus[msg.sender] = 'inactive';
   		registeredNodesStake[msg.sender] = entryStake;
      emit nodeStatusChangeEvent('inactive', msg.sender);
  	}

   	function start() public {
 		  require(keccak256(nodeStatus[msg.sender]) == keccak256("inactive"));
 	   	nodeStatus[msg.sender] = 'active';
 	   	emit nodeStatusChangeEvent('active', msg.sender);
   	}

   	function stop(uint256 mined) public {
 		  require(keccak256(nodeStatus[msg.sender]) == keccak256("active"));
      // adding mined picolos
      balances[msg.sender] = balances[msg.sender].add(mined);
      totalPayments = totalPayments.add(mined);
 	   	nodeStatus[msg.sender] = 'inactive';
 	   	emit nodeStatusChangeEvent('inactive', msg.sender);
   	}

   	function unregister(uint256 mined) public {
      address payee = msg.sender;
   		require(keccak256(nodeStatus[payee]) != keccak256("malicious"));
   		require(keccak256(nodeStatus[payee]) != keccak256("pending"));

      uint256 payment = registeredNodesStake[payee];
      require(payment != 0);
      require(address(this).balance >= payment);

      registeredNodesStake[payee] = 0;
      nodeStatus[payee] = '';
      // adding mined picolos
      balances[payee] = balances[payee].add(mined);
      totalPayments = totalPayments.add(mined);
      // transferring ether security deposit
      payee.transfer(payment);
 	   	emit nodeStatusChangeEvent('unregistered', msg.sender);
   	}

    function claim(uint256 mined) public checkClaim {
      address payee = msg.sender;
      require(mined != 0);
      balances[payee] = balances[payee].add(mined);
      totalPayments = totalPayments.add(mined);
    }

   	function changeEntryStake(uint _stake) public onlyOwner {
        entryStake = _stake;
    }

    function getContractBalance() public view returns(uint) {
        return address(this).balance;
    }

    // Challenges
    function addPotentialMalicious(address _target) public {
    	require(keccak256(nodeStatus[_target]) != keccak256("malicious"));
   	  nodeStatus[_target] = 'pending';
    }

    // Consensus
    function voteMalicious(address _target, bool _convict) public onlyValidators {
    	require(keccak256(nodeStatus[_target]) == keccak256("pending"));
    	voteTally[_target].add(1);
    	if (_convict) {
    		maliciousVoteTally[_target].add(1);
    	}
    	if (voteTally[_target] >= convictThreshold
    		&& maliciousVoteTally[_target].mul(2).add(1) > voteTally[_target]) {
    		nodeStatus[_target] = 'malicious';
   	   	emit nodeStatusChangeEvent('malicious', msg.sender);
    	}
    }
    // todo: TCR for masternodes
}

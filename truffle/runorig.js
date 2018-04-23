'use strict';

if (process.argv.length != 4) {
  console.log('Usage: node runorig.js <mode> <maxGas>');
  process.exit(1);
}

require('dotenv').load();
const constants = require('./constants.js');

const HDWalletProvider = require("truffle-hdwallet-provider");
const contractAbstraction = require('truffle-contract');

const mode = process.argv[2];
let maxGas = process.argv[3];
let rpcnode;
let addr_index;
let provider;
let defaultAccount;

if (mode === 'local') {
  rpcnode = process.env.LOCAL_RPC;
  addr_index = 0;
  provider = new HDWalletProvider(process.env.LOCAL_MNEMONIC, rpcnode, addr_index);
  defaultAccount = provider.getAddress(addr_index);
} else if (mode === 'ropsten') {
  rpcnode = process.env.ROPSTEN_RPC;
  addr_index = 0;
  provider = new HDWalletProvider(process.env.ROPSTEN_MNEMONIC, rpcnode + '/' + process.env.INFURA_ACCESS_TOKEN, addr_index);
  defaultAccount = provider.getAddress(addr_index);
} else {
  console.log('Invalid mode. Valid modes are `local` and `ropsten`');
  process.exit(1);
}

const loadedContracts = {};

function loadContracts() {

  let contractJson = require(constants.BUILD_DIR + constants.CONTRACTS.KITTY_CORE + '.json');
  let loadedContract = contractAbstraction(contractJson);
  // Provision the contract with a provider
  loadedContract.setProvider(provider);
  // due to a bug add below lines
  if (typeof loadedContract.currentProvider.sendAsync !== "function") {
    loadedContract.currentProvider.sendAsync = function() {
      return loadedContract.currentProvider.send.apply(loadedContract.currentProvider, arguments);
    };
  }
  loadedContract.defaults({
    from: defaultAccount,
    gas: 10 ** 6
  });
  loadedContracts[constants.CONTRACTS.KITTY_CORE] = loadedContract;

}

function createPromoKitty(genes, owner) {
  loadedContracts[constants.CONTRACTS.KITTY_CORE].deployed().then(function(instance) {
    instance.createPromoKitty(genes, owner).then(function(result) {
      let lastGasUsed = result.receipt.gasUsed;
      maxGas -= lastGasUsed;
      console.log('Gas used: ' + lastGasUsed, 'Gas remaining: ' + maxGas);
      //call again
      if (maxGas > lastGasUsed) {
        createPromoKitty(new Date().getTime(), defaultAccount);
      }
    }).catch(function(e) {
      console.log(e);
    });
  }).catch(function(e) {
    console.log(e);
  });
}

// Load contracts into the application
loadContracts();


//create Kitties
createPromoKitty(new Date().getTime(), defaultAccount);
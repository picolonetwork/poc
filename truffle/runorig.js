'use strict';

const constants = require('./constants.js');

const Web3 = require('web3');
const contractAbstraction = require('truffle-contract');

const rpcnode = process.argv[2];
const defaultAccount = process.argv[3];
const numKitties = process.argv[4];

const provider = new Web3.providers.HttpProvider(rpcnode);
const web3 = new Web3(provider);

const loadedContracts = {};

function loadContracts() {
  for (let contract of Object.values(constants.CONTRACTS)) {
    let contractJson = require(constants.BUILD_DIR + contract + '.json');
    let loadedContract = contractAbstraction(contractJson);
    // Provision the contract with a web3 provider
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
    loadedContracts[contract] = loadedContract;
  }
}

function createPromoKitty(genes, owner) {
  loadedContracts[constants.CONTRACTS.KITTY_CORE].deployed().then(function(instance) {
    instance.createPromoKitty(genes, owner);
  }).catch(function(e) {
    console.log(e);
  });
}

// Load contracts into the application
loadContracts();

//create Kitties
for (let i = 0; i < numKitties; i++) {
  createPromoKitty(new Date().getTime(), defaultAccount);
}
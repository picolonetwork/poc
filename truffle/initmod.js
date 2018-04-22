'use strict';

const constants = require('./constants.js');

const Web3 = require('web3');
const contractAbstraction = require('truffle-contract');

const rpcnode = process.argv[2];
const defaultAccount = process.argv[3];

const provider = new Web3.providers.HttpProvider(rpcnode);
const web3 = new Web3(provider);

const loadedContracts = {};

function loadContracts() {
  for (let contract of Object.values(constants.CONTRACTS_MOD)) {
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

function initContracts() {
  let saleAddress = '0x0';
  let sireAddress = '0x0';
  let genesAddress = '0x0';

  loadedContracts[constants.CONTRACTS_MOD.SALE_CLOCK_AUCTION_MOD].deployed().then(function(instance) {
    saleAddress = instance.address;
  }).catch(function(e) {
    console.log(e);
  });

  loadedContracts[constants.CONTRACTS_MOD.SIRING_CLOCK_AUCTION_MOD].deployed().then(function(instance) {
    sireAddress = instance.address;
  }).catch(function(e) {
    console.log(e);
  });

  loadedContracts[constants.CONTRACTS_MOD.GENE_SCIENCE_MOD].deployed().then(function(instance) {
    genesAddress = instance.address;
  }).catch(function(e) {
    console.log(e);
  });

  loadedContracts[constants.CONTRACTS_MOD.KITTY_CORE_MOD].deployed().then(function(instance) {
    instance.setSaleAuctionAddress(saleAddress);
    instance.setSiringAuctionAddress(sireAddress);
    instance.setGeneScienceAddress(genesAddress);
    instance.setCFO(defaultAccount);
    instance.unpause();
  }).catch(function(e) {
    console.log(e);
  });
}

// Load and init contracts into the application
loadContracts();
initContracts();
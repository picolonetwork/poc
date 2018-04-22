'use strict';

const constants = require('./constants.js');

const Web3 = require('web3');
const contractAbstraction = require('truffle-contract');
const pg = require('pg');

const rpcnode = process.argv[2];
const defaultAccount = process.argv[3];
const numKitties = process.argv[4];

const provider = new Web3.providers.HttpProvider(rpcnode);
const web3 = new Web3(provider);

const loadedContracts = {};

//init pool
const pool = new pg.Pool(constants.DB_CONFIG);

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

function createPromoKitty(genes, owner) {
  loadedContracts[constants.CONTRACTS_MOD.KITTY_CORE_MOD].deployed().then(function(instance) {
    instance.createPromoKitty(genes, owner).then(function(result) {
      console.log('Gas used: ' + result.receipt.gasUsed, 'Cumulative gas used: ' + result.receipt.cumulativeGasUsed);
      writeToDb(result);
    }).catch(function(e) {
      console.log(e);
    });
  }).catch(function(e) {
    console.log(e);
  });
}

function writeToDb(result) {
  let query = 'INSERT INTO kitty(id, genes, birthtime, cooldownendblock, matronId, sireId, siringwith, cooldownindex, generation) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)';

  let data = result.logs[1].args;
  let values = [];
  values.push(data['id'].toNumber());
  values.push(data['genes'].toNumber());
  values.push(data['birthtime'].toNumber());
  values.push(data['cooldownendblock'].toNumber());
  values.push(data['matronId'].toNumber());
  values.push(data['sireId'].toNumber());
  values.push(data['siringwith'].toNumber());
  values.push(data['cooldownindex'].toNumber());
  values.push(data['generation'].toNumber());

  pool.query(query, values, function(err, res) {
    if (err) {
      console.log('error in insert', err)
    } else {

    }
  });
}

// Load contracts into the application
loadContracts();

//create Kitties
for (let i = 0; i < numKitties; i++) {
  createPromoKitty(new Date().getTime(), defaultAccount);
}
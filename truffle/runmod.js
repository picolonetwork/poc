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
let numKittiesCreated = 0;

if (mode === 'local') {
  rpcnode = process.env.LOCAL_RPC;
  addr_index = 1;
  provider = new HDWalletProvider(process.env.LOCAL_MNEMONIC, rpcnode, addr_index);
  defaultAccount = provider.getAddress(addr_index);
} else if (mode === 'ropsten') {
  rpcnode = process.env.ROPSTEN_RPC;
  addr_index = 4;
  provider = new HDWalletProvider(process.env.ROPSTEN_MNEMONIC, rpcnode + '/' + process.env.INFURA_ACCESS_TOKEN, addr_index);
  defaultAccount = provider.getAddress(addr_index);
} else {
  console.log('Invalid mode. Valid modes are `local` and `ropsten`');
  process.exit(1);
}

const pg = require('pg');

const loadedContracts = {};

//init pool
const pool = new pg.Pool(constants.DB_CONFIG);

function loadContracts() {

  let contractJson = require(constants.BUILD_DIR + constants.CONTRACTS_MOD.KITTY_CORE_MOD + '.json');
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
  loadedContracts[constants.CONTRACTS_MOD.KITTY_CORE_MOD] = loadedContract;

}

function createPromoKitty(genes, owner) {
  loadedContracts[constants.CONTRACTS_MOD.KITTY_CORE_MOD].deployed().then(function(instance) {
    instance.createPromoKitty(genes, owner).then(function(result) {
      console.log('# kitties created: ', ++numKittiesCreated);
      let lastGasUsed = result.receipt.gasUsed;
      maxGas -= lastGasUsed;
      console.log('Gas used: ' + lastGasUsed, 'Gas remaining: ' + maxGas);
      writeToDb(result);
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

function writeToDb(result, count) {
  let query = 'INSERT INTO kitty(id, genes, birthtime, cooldownendblock, matronId, sireId, siringwith, cooldownindex, generation) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  let log;
  for (let i = 0; i < result.logs.length; i++) {
    log = result.logs[i];
    if (log.event === "NewKitty") {
      // We found the event!
      break;
    }
  }

  let data = log.args;
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
    } else {}
  });
}

// Load contracts into the application
loadContracts();

//create Kitties
createPromoKitty(new Date().getTime(), defaultAccount);
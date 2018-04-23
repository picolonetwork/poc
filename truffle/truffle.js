require('dotenv').load();
const HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = process.env.ROPSTEN_MNEMONIC;
const infura_apikey = process.env.INFURA_ACCESS_TOKEN;
const addr_index = process.env.ROPSTEN_MNEMONIC_ADDR_INDEX;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/" + infura_apikey, addr_index),
      network_id: "3",
      gas: 4612388
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
'use strict';

if (process.argv.length != 3) {
  console.log('Usage: node run.js <mode>');
  process.exit(1);
}

require('dotenv').load();
const {
  spawn
} = require('child_process');

const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require('web3');
const contractAbstraction = require('truffle-contract');
const http = require('http');
const https = require('https');
const bodyParser = require("body-parser");
const constants = require('./constants.js');

const mode = process.argv[2];
let rpcnode;
let addr_index;
let provider;
let defaultAccount;
let mined = 0;
let miner;

if (mode === 'local') {
  rpcnode = process.env.LOCAL_RPC;
  addr_index = 0;
  provider = new HDWalletProvider(process.env.LOCAL_MNEMONIC, rpcnode, addr_index);
  //provider = new Web3.providers.HttpProvider(rpcnode);
  defaultAccount = provider.getAddress(addr_index);
} else if (mode === 'ropsten') {
  rpcnode = process.env.ROPSTEN_RPC;
  addr_index = 0;
  provider = new HDWalletProvider(process.env.ROPSTEN_MNEMONIC, rpcnode + '/' + process.env.INFURA_ACCESS_TOKEN, addr_index);
  //provider = new Web3.providers.HttpProvider(rpcnode);
  defaultAccount = provider.getAddress(addr_index);
} else {
  console.log('Invalid mode. Valid modes are `local` and `ropsten`');
  process.exit(1);
}

const web3 = new Web3(provider);

// Step 1: Get a contract into my application
const picoloJson = require('./abi/Picolo.json');

// Step 2: Turn that contract into an abstraction I can use
const picoloContract = contractAbstraction(picoloJson);

// Step 3: Provision the contract with a web3 provider
picoloContract.setProvider(provider);
// due to a bug add below lines
if (typeof picoloContract.currentProvider.sendAsync !== "function") {
  picoloContract.currentProvider.sendAsync = function() {
    return picoloContract.currentProvider.send.apply(picoloContract.currentProvider, arguments);
  };
}
picoloContract.defaults({
  from: defaultAccount,
  gas: 10 ** 6
});

// Step 4: Start server and use the contract!
const express = require('express');
const app = express();

http.get({
  'host': 'api.ipify.org',
  'port': 80,
  'path': '/'
}, function(resp) {
  resp.on('data', function(ip) {
    console.log("My public IP address is: " + ip);
    app.myIp = ip;
  });
});
https.get('https://picolo-b4999.firebaseio.com/cluster_ip.json', (res) => {
  res.on('data', function(ip) {
    app.clusterAddr = ip + ':26257';
    app.clusterAddr = app.clusterAddr.replace(/"/g, "");
    console.log("Cluster address is: " + app.clusterAddr);
  });
});

app.use(express.static('app'));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile("./app/index.html", {
    "root": __dirname
  });
})

app.post('/register', function(req, res) {
  console.log('registering');
  register(req, res);
  res.end();
})

app.post('/start', function(req, res) {
  console.log('starting');
  start(req, res);
  res.end();
})

app.post('/claim', function(req, res) {
  console.log('claiming');
  claim(req, res);
  res.end();
})

app.post('/stop', function(req, res) {
  console.log('stopping');
  stop(req, res);
  res.end();
})

app.post('/unregister', function(req, res) {
  console.log('unregistering');
  unregister(req, res);
  res.end();
})

const server = app.listen(9090, function() {
  var host = server.address().address
  var port = server.address().port

  console.log("App listening at http://%s:%s", host, port)

})

function register(req, res) {
  let stake = web3.utils.toWei(req.body.stake, 'ether');
  console.log('stake sent: ' + stake);
  if (mode === 'local') {
    picoloContract.deployed().then(function(instance) {
      invokeRegister(instance, stake);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  } else if (mode === 'ropsten') {
    picoloContract.at(constants.CONTRACT_ADDRESS.ROPSTEN.PICOLO).then(function(instance) {
      invokeRegister(instance, stake);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  }
}

function invokeRegister(instance, stake) {
  instance.register({
    value: stake
  }).then(function(status) {
    console.log('registered');
  }).catch(function(e) {
    console.log(e);
  });
}

function start(req, res) {
  if (mode === 'local') {
    picoloContract.deployed().then(function(instance) {
      invokeStart(instance);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  } else if (mode === 'ropsten') {
    picoloContract.at(constants.CONTRACT_ADDRESS.ROPSTEN.PICOLO).then(function(instance) {
      invokeStart(instance);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  }
}

function invokeStart(instance) {
  instance.start().then(function(status) {
    let db = spawn('cockroach', ['start', '--insecure', '--join', app.clusterAddr, '--advertise-host', app.myIp, '--port', 26257, '--http-port', 8080, '--store', 'node_picolo', '--background']);
    followStd(db, 'start');
  }).catch(function(e) {
    console.log(e);
  });
}

function claim(req, res) {
  if (mode === 'local') {
    picoloContract.deployed().then(function(instance) {
      invokeClaim(instance);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  } else if (mode === 'ropsten') {
    picoloContract.at(constants.CONTRACT_ADDRESS.ROPSTEN.PICOLO).then(function(instance) {
      invokeClaim(instance);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  }
}

function invokeClaim(instance) {
  instance.claim(mined).then(function(status) {
    console.log('claimed');
    mined = 0;
  }).catch(function(e) {
    console.log(e);
  });
}

function stop(req, res) {
  if (mode === 'local') {
    picoloContract.deployed().then(function(instance) {
      invokeStop(instance);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  } else if (mode === 'ropsten') {
    picoloContract.at(constants.CONTRACT_ADDRESS.ROPSTEN.PICOLO).then(function(instance) {
      invokeStop(instance);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  }
}

function invokeStop(instance) {
  instance.stop(mined).then(function(status) {
    let db = spawn('cockroach', ['quit', '--insecure']);
    followStd(db, 'stop');
  }).catch(function(e) {
    console.log(e);
  });
}

function unregister(req, res) {
  if (mode === 'local') {
    picoloContract.deployed().then(function(instance) {
      invokeUnregister(instance);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  } else if (mode === 'ropsten') {
    picoloContract.at(constants.CONTRACT_ADDRESS.ROPSTEN.PICOLO).then(function(instance) {
      invokeUnregister(instance);
    }).catch(function(e) {
      console.log(e);
      res.write(e); //write a response to the client
    });
  }
}

function invokeUnregister(instance) {
  instance.unregister(mined).then(function(status) {
    let db = spawn('cockroach', ['quit', '--insecure']);
    //let db = spawn('cockroach', ['quit', '--insecure', '--decommission']);
    followStd(db, 'unregister');
  }).catch(function(e) {
    console.log(e);
  });
}

function followStd(db, cmd) {
  db.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    if (cmd === 'start') {
      startMining();
    }
    if (cmd === 'stop' || cmd === 'unregister') {
      stopMining();
    }
  });

  db.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  db.on('close', (code) => {
    console.log(`child process exited with code: ${code}`);
    stopMining();
  });
}

function startMining() {
  console.log('starting mining');
  miner = setInterval(() => {
    mined += 100;
    console.log('mined so far: ' + mined);
  }, 10 * 1000);
}

function stopMining() {
  console.log('stopping mining');
  clearInterval(miner);
}
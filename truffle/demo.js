'use strict';

if (process.argv.length != 2) {
  console.log('Usage: node demo.js');
  process.exit(1);
}

const {
  spawn
} = require('child_process');

const mode = process.argv[2];
const maxGas = process.argv[3];

let mod;
let orig;

const express = require('express');
const app = express();
const bodyParser = require("body-parser");

let respBackMod;
let respBackOrig;
let clientWsConn;

const Server = require('ws').Server;
const port = 9092;
const ws = new Server({
  port: port
});

ws.on('connection', function(w) {
  clientWsConn = w;

  w.on('message', function(msg) {
    console.log('message from client', msg);
  });

  w.on('close', function() {
    console.log('closing connection');
  });
});

ws.on('open', function() {
  console.log('opened connection');
});

app.use(express.static('app/public'));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile("./app/public/index.html", {
    "root": __dirname
  });
})

app.post('/start', function(req, res) {
  console.log('starting', req.body.mode, req.body.gas);
  mod = spawn('node', ['./runmod.js', req.body.mode, req.body.gas]);
  followStd(mod, 'mod', res);
  orig = spawn('node', ['./runorig.js', req.body.mode, req.body.gas]);
  followStd(orig, 'orig', res);
  res.end();
})

app.post('/stop', function(req, res) {
  console.log('stopping');
  mod.kill();
  orig.kill();
  res.end();
})

const server = app.listen(9091, function() {
  var host = server.address().address
  var port = server.address().port
  console.log("App listening at http://%s:%s", host, port)
})

function followStd(cmd, variant, res) {
  cmd.stdout.on('data', (data) => {
    data = JSON.parse(data);
    console.log(variant + ' stdout ', data.numCreated, data.gasUsed, data.gasRemaining);
    let resp = {};
    resp.variant = variant;
    resp.data = data;
    //res.write(JSON.stringify(resp));
    if (variant == 'mod') {
      respBackMod = JSON.stringify(resp);
      sendRespToClient(respBackMod);
    }
    if (variant == 'orig') {
      respBackOrig = JSON.stringify(resp);
      sendRespToClient(respBackOrig);
    }
  });

  function sendRespToClient(resp) {
    if (clientWsConn.readyState == 1) {
      clientWsConn.send(resp);
    } else {
      //console.log(clientWsConn);
      console.log('ws connection null or not open');
    }
  }

  cmd.stderr.on('data', (data) => {
    console.log(variant + ' stderr ' + data);
  });

  cmd.on('close', (code) => {
    console.log(`child process ${variant} exited with code: ${code}`);
  });
}
var Picolo = artifacts.require("Picolo");
var KittyCore = artifacts.require("KittyCore");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Picolo);
  deployer.deploy(KittyCore);
};

const KittyOwnership = artifacts.require("KittyOwnership");
const KittyCore = artifacts.require("KittyCore");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(KittyOwnership);
  deployer.deploy(KittyCore);
};
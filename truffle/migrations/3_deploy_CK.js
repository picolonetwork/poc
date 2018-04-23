const KittyOwnershipMod = artifacts.require("KittyOwnershipMod");
const KittyCoreMod = artifacts.require("KittyCoreMod");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(KittyOwnershipMod);
  deployer.deploy(KittyCoreMod);
};
const Picolo = artifacts.require("Picolo");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Picolo);
};
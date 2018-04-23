const KittyOwnership = artifacts.require("KittyOwnership");
const SaleClockAuction = artifacts.require("SaleClockAuction");
const SiringClockAuction = artifacts.require("SiringClockAuction");
const GeneScience = artifacts.require("GeneScience");
const KittyCore = artifacts.require("KittyCore");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(KittyOwnership).then(function() {
    deployer.deploy(SaleClockAuction, KittyOwnership.address, 100);
    deployer.deploy(SiringClockAuction, KittyOwnership.address, 100);
  });
  deployer.deploy(GeneScience);
  deployer.deploy(KittyCore);
};
var KittyOwnership = artifacts.require("KittyOwnership");
var SaleClockAuction = artifacts.require("SaleClockAuction");
var SiringClockAuction = artifacts.require("SiringClockAuction");
var GeneScience = artifacts.require("GeneScience");
var KittyCore = artifacts.require("KittyCore");

module.exports = function(deployer, network, accounts) {
  var ownership, sale, sire, gene, core;
  deployer.deploy(KittyOwnership).then(function() {
    ownership = KittyOwnership.address;
    deployer.deploy(SaleClockAuction, ownership, 100).then(function() {
      sale = SaleClockAuction.address;
    });
    deployer.deploy(SiringClockAuction, ownership, 100).then(function() {
      sire = SiringClockAuction.address;
    });
  });
  deployer.deploy(GeneScience).then(function() {
    gene = GeneScience.address;
  });
  deployer.deploy(KittyCore).then(function() {
    core = KittyCore.address;
  });
};

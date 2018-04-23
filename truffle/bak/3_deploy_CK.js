const KittyOwnershipMod = artifacts.require("KittyOwnershipMod");
const SaleClockAuctionMod = artifacts.require("SaleClockAuctionMod");
const SiringClockAuctionMod = artifacts.require("SiringClockAuctionMod");
const KittyCoreMod = artifacts.require("KittyCoreMod");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(KittyOwnershipMod).then(function() {
    deployer.deploy(SaleClockAuctionMod, KittyOwnershipMod.address, 100);
    deployer.deploy(SiringClockAuctionMod, KittyOwnershipMod.address, 100);
  });
  deployer.deploy(KittyCoreMod);
};
module.exports = {
  BUILD_DIR: './build/contracts/',
  CONTRACTS: {
    KITTY_OWNERSHIP: 'KittyOwnership',
    SALE_CLOCK_AUCTION: 'SaleClockAuction',
    SIRING_CLOCK_AUCTION: 'SiringClockAuction',
    GENE_SCIENCE: 'GeneScience',
    KITTY_CORE: 'KittyCore'
  },
  CONTRACTS_MOD: {
    KITTY_OWNERSHIP_MOD: 'KittyOwnershipMod',
    SALE_CLOCK_AUCTION_MOD: 'SaleClockAuctionMod',
    SIRING_CLOCK_AUCTION_MOD: 'SiringClockAuctionMod',
    GENE_SCIENCE_MOD: 'GeneScience',
    KITTY_CORE_MOD: 'KittyCoreMod'
  },
  DB_CONFIG: {
    user: 'root',
    host: 'localhost',
    database: 'ck',
    port: 26257
  }
}
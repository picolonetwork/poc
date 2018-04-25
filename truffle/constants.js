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
  LOCAL_DB_CONFIG: {
    user: 'local',
    host: 'localhost',
    database: 'local',
    port: 26257
  },
  ROPSTEN_DB_CONFIG: {
    user: 'ropsten',
    host: 'localhost',
    database: 'ropsten',
    port: 26257
  },
  CONTRACT_ADDRESS: {
    ROPSTEN: {
      KITTY_CORE: '0x80aa41cbcaa1a58f4e93103353b2342094682747',
      KITTY_CORE_MOD: '0x8582081a530f61fc5958925d11b11fe71ae7e75a',
      PICOLO: '0xc6d72ef8c88ea0f5ac29ad599cae2952bb3c7217'
    }
  }
}
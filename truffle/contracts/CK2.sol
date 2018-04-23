pragma solidity ^0.4.11;

import "./CKOrig2.sol";

contract KittyBaseMod is KittyAccessControl {

    event NewKitty(uint64 id, uint256 genes, uint256 birthtime, uint16 cooldownendblock, uint64 matronId, uint64 sireId, uint64 siringwith, uint16 cooldownindex, uint16 generation);

    event Transfer(address from, address to, uint256 tokenId);


    uint256 public secondsPerBlock = 15;


    mapping (uint256 => address) public kittyIndexToOwner;

    mapping (address => uint256) ownershipTokenCount;

    mapping (uint256 => address) public kittyIndexToApproved;


    function _transfer(address _from, address _to, uint256 _tokenId) internal {

        ownershipTokenCount[_to]++;

        kittyIndexToOwner[_tokenId] = _to;

        if (_from != address(0)) {
            ownershipTokenCount[_from]--;

            delete kittyIndexToApproved[_tokenId];
        }

        Transfer(_from, _to, _tokenId);
    }

    function _createKittyMod(uint256 promoCreatedCount,
        uint256 _matronId,
        uint256 _sireId,
        uint256 _generation,
        uint256 _genes,
        address _owner
    )
        internal
        returns (uint)
    {

        uint256 newKittenId = promoCreatedCount + 1;

        _transfer(0, _owner, newKittenId);

	      NewKitty(uint64(newKittenId), _genes, uint256(now), 0, uint64(_matronId), uint64(_sireId), 0, uint16(0), uint16(_generation));
        return newKittenId;
    }


    function setSecondsPerBlock(uint256 secs) external onlyCLevel {
        secondsPerBlock = secs;
    }
}

contract KittyOwnershipMod is KittyBaseMod, ERC721 {

    string public constant name = "CryptoKitties";
    string public constant symbol = "CK";
    uint256 public promoCreatedCount;

    bytes4 constant InterfaceSignature_ERC165 =
        bytes4(keccak256('supportsInterface(bytes4)'));

    bytes4 constant InterfaceSignature_ERC721 =
        bytes4(keccak256('name()')) ^
        bytes4(keccak256('symbol()')) ^
        bytes4(keccak256('totalSupply()')) ^
        bytes4(keccak256('balanceOf(address)')) ^
        bytes4(keccak256('ownerOf(uint256)')) ^
        bytes4(keccak256('approve(address,uint256)')) ^
        bytes4(keccak256('transfer(address,uint256)')) ^
        bytes4(keccak256('transferFrom(address,address,uint256)')) ^
        bytes4(keccak256('tokensOfOwner(address)')) ;

    function supportsInterface(bytes4 _interfaceID) external view returns (bool)
    {
        return ((_interfaceID == InterfaceSignature_ERC165) || (_interfaceID == InterfaceSignature_ERC721));
    }

    function _owns(address _claimant, uint256 _tokenId) internal view returns (bool) {
        return kittyIndexToOwner[_tokenId] == _claimant;
    }

    function _approvedFor(address _claimant, uint256 _tokenId) internal view returns (bool) {
        return kittyIndexToApproved[_tokenId] == _claimant;
    }

    function _approve(uint256 _tokenId, address _approved) internal {
        kittyIndexToApproved[_tokenId] = _approved;
    }

    function balanceOf(address _owner) public view returns (uint256 count) {
        return ownershipTokenCount[_owner];
    }

    function transfer(
        address _to,
        uint256 _tokenId
    )
        external
        whenNotPaused
    {

        require(_to != address(0));

        require(_to != address(this));

        require(_owns(msg.sender, _tokenId));

        _transfer(msg.sender, _to, _tokenId);
    }

    function approve(
        address _to,
        uint256 _tokenId
    )
        external
        whenNotPaused
    {

        require(_owns(msg.sender, _tokenId));


        _approve(_tokenId, _to);


        Approval(msg.sender, _to, _tokenId);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    )
        external
        whenNotPaused
    {

        require(_to != address(0));



        require(_to != address(this));

        require(_approvedFor(msg.sender, _tokenId));
        require(_owns(_from, _tokenId));


        _transfer(_from, _to, _tokenId);
    }

    function totalSupply() public view returns (uint) {
        return promoCreatedCount;
    }

    function ownerOf(uint256 _tokenId)
        external
        view
        returns (address owner)
    {
        owner = kittyIndexToOwner[_tokenId];

        require(owner != address(0));
    }

    function tokensOfOwner(address _owner) external view returns(uint256[] ownerTokens) {
        uint256 tokenCount = balanceOf(_owner);

        if (tokenCount == 0) {

            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 totalCats = totalSupply();
            uint256 resultIndex = 0;



            uint256 catId;

            for (catId = 1; catId <= totalCats; catId++) {
                if (kittyIndexToOwner[catId] == _owner) {
                    result[resultIndex] = catId;
                    resultIndex++;
                }
            }

            return result;
        }
    }

}


contract KittyMintingMod is KittyOwnershipMod {

    uint256 public constant PROMO_CREATION_LIMIT = 5000;

    function createPromoKitty(uint256 _genes, address _owner) {
        address kittyOwner = _owner;
        if (kittyOwner == address(0)) {
             kittyOwner = cooAddress;
        }
        require(promoCreatedCount < PROMO_CREATION_LIMIT);

        promoCreatedCount = _createKittyMod(promoCreatedCount, 0, 0, 0, _genes, kittyOwner);
    }

}

contract KittyCoreMod is KittyMintingMod {

    function KittyCoreMod() public {

        paused = false;

        ceoAddress = msg.sender;

        cooAddress = msg.sender;

    }

}

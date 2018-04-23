pragma solidity ^0.4.11;

contract ERC721 {

    function totalSupply() public view returns (uint256 total);
    function balanceOf(address _owner) public view returns (uint256 balance);
    function ownerOf(uint256 _tokenId) external view returns (address owner);
    function approve(address _to, uint256 _tokenId) external;
    function transfer(address _to, uint256 _tokenId) external;
    function transferFrom(address _from, address _to, uint256 _tokenId) external;


    event Transfer(address from, address to, uint256 tokenId);
    event Approval(address owner, address approved, uint256 tokenId);

    function supportsInterface(bytes4 _interfaceID) external view returns (bool);
}


contract KittyAccessControl {

    address public ceoAddress;
    address public cfoAddress;
    address public cooAddress;


    bool public paused = false;


    modifier onlyCEO() {
        require(msg.sender == ceoAddress);
        _;
    }


    modifier onlyCFO() {
        require(msg.sender == cfoAddress);
        _;
    }


    modifier onlyCOO() {
        require(msg.sender == cooAddress);
        _;
    }

    modifier onlyCLevel() {
        require(
            msg.sender == cooAddress ||
            msg.sender == ceoAddress ||
            msg.sender == cfoAddress
        );
        _;
    }

    function setCEO(address _newCEO) external onlyCEO {
        require(_newCEO != address(0));

        ceoAddress = _newCEO;
    }



    function setCFO(address _newCFO) external onlyCEO {
        require(_newCFO != address(0));

        cfoAddress = _newCFO;
    }



    function setCOO(address _newCOO) external onlyCEO {
        require(_newCOO != address(0));

        cooAddress = _newCOO;
    }

    /*** Pausable functionality adapted from OpenZeppelin ***/


    modifier whenNotPaused() {
        require(!paused);
        _;
    }

    modifier whenPaused {
        require(paused);
        _;
    }

    function pause() external onlyCLevel whenNotPaused {
        paused = true;
    }

    function unpause() public onlyCEO whenPaused {

        paused = false;
    }
}

contract KittyBase is KittyAccessControl {

    event NewKitty(uint64 id, uint256 genes, uint256 birthtime, uint16 cooldownendblock, uint64 matronId, uint64 sireId, uint64 siringwith, uint16 cooldownindex, uint16 generation);

    event Transfer(address from, address to, uint256 tokenId);

    struct Kitty {

        uint256 genes;

        uint64 birthTime;

        uint64 cooldownEndBlock;

        uint32 matronId;
        uint32 sireId;

        uint32 siringWithId;

        uint16 cooldownIndex;

        uint16 generation;
    }

    uint256 public secondsPerBlock = 15;

    /*** STORAGE ***/

    Kitty[] kitties;

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

    function _createKitty(
        uint256 _matronId,
        uint256 _sireId,
        uint256 _generation,
        uint256 _genes,
        address _owner
    )
        internal
        returns (uint)
    {

        require(_matronId == uint256(uint32(_matronId)));
        require(_sireId == uint256(uint32(_sireId)));
        require(_generation == uint256(uint16(_generation)));


        uint16 cooldownIndex = uint16(_generation / 2);
        if (cooldownIndex > 13) {
            cooldownIndex = 13;
        }

        Kitty memory _kitty = Kitty({
            genes: _genes,
            birthTime: uint64(now),
            cooldownEndBlock: 0,
            matronId: uint32(_matronId),
            sireId: uint32(_sireId),
            siringWithId: 0,
            cooldownIndex: cooldownIndex,
            generation: uint16(_generation)
        });
        uint256 newKittenId = kitties.push(_kitty) - 1;

        require(newKittenId == uint256(uint32(newKittenId)));


        NewKitty(uint64(newKittenId), _genes, uint256(now), 0, uint64(_matronId), uint64(_sireId), 0, uint16(0), uint16(_generation));


        _transfer(0, _owner, newKittenId);

        return newKittenId;
    }


    function setSecondsPerBlock(uint256 secs) external onlyCLevel {
        secondsPerBlock = secs;
    }
}


contract KittyOwnership is KittyBase, ERC721 {


    string public constant name = "CryptoKitties";
    string public constant symbol = "CK";


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
        bytes4(keccak256('tokensOfOwner(address)'));

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
        return kitties.length - 1;
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

contract KittyMinting is KittyOwnership {


    uint256 public constant PROMO_CREATION_LIMIT = 5000;

    uint256 public promoCreatedCount;


    function createPromoKitty(uint256 _genes, address _owner) {
        address kittyOwner = _owner;
        if (kittyOwner == address(0)) {
             kittyOwner = cooAddress;
        }
        require(promoCreatedCount < PROMO_CREATION_LIMIT);

        promoCreatedCount++;
        _createKitty(0, 0, 0, _genes, kittyOwner);
    }


}

contract KittyCore is KittyMinting {


    function KittyCore() public {

        paused = false;


        ceoAddress = msg.sender;


        cooAddress = msg.sender;

    }

    function getKitty(uint256 _id)
        external
        view
        returns (
        bool isGestating,
        bool isReady,
        uint256 cooldownIndex,
        uint256 nextActionAt,
        uint256 siringWithId,
        uint256 birthTime,
        uint256 matronId,
        uint256 sireId,
        uint256 generation,
        uint256 genes
    ) {
        Kitty storage kit = kitties[_id];


        isGestating = (kit.siringWithId != 0);
        isReady = (kit.cooldownEndBlock <= block.number);
        cooldownIndex = uint256(kit.cooldownIndex);
        nextActionAt = uint256(kit.cooldownEndBlock);
        siringWithId = uint256(kit.siringWithId);
        birthTime = uint256(kit.birthTime);
        matronId = uint256(kit.matronId);
        sireId = uint256(kit.sireId);
        generation = uint256(kit.generation);
        genes = kit.genes;
    }



}

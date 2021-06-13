// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract Benders is ERC721, VRFConsumerBase {
  bytes32 internal keyHash;
  address public VRFCoordinator;
  address public LinkToken;
  uint256 internal fee;

  struct Character {
    uint256 strength;
    uint256 dexterity;
    uint256 constitution;
    uint256 intelligence;
    uint256 wisdom;
    uint256 charisma;
    uint256 experience;
    string name;
    uint256 heroId;
  }

  event Minted(address _owner, uint256 _tokenId);

  Character[] public characters;

  mapping(bytes32 => string) requestIdToCharacterName;
  mapping(bytes32 => address) requestIdToOwner;

  constructor(address _vrfcoordinator, address _linktoken, bytes32 _keyhash)
    VRFConsumerBase(_vrfcoordinator, _linktoken)
    ERC721('Fate Series', 'TYPE-MOON') public {
      keyHash = _keyhash;
      VRFCoordinator = _vrfcoordinator;
      LinkToken = _linktoken;
      fee = 0.1 * 10**18; //0.1 LINK
  }

  /*********SETTERS**********/

  function requestNewRandomHero(string memory _name, uint256 _seed) public returns(bytes32){
    require(LINK.balanceOf(address(this)) >= fee, "Link contract balance is insufficient for fee, please fund more link");
    bytes32 requestId = requestRandomness(keyHash, fee, _seed);
    requestIdToCharacterName[requestId] = _name;
    requestIdToOwner[requestId] = msg.sender;
    return requestId;
  }

  //create the fulfillRandomness w/ the args in order to make requestRandomness() work
  //this gets invoked directly after the requestRandmness() finishes - https://docs.chain.link/docs/get-a-random-number/
  function fulfillRandomness(bytes32 _requestId, uint256 _randomNumber) internal override {
    //calculates all of the stats and pushes it to the array
    uint256 tokenId = characters.length;
    address owner = requestIdToOwner[_requestId];
    console.logBytes32(_requestId);
    console.log("the _randomNumber is: ", _randomNumber);

    //calculates the stats based on verfiable random number has been generated
    uint256 strength = (_randomNumber % 100);
    uint256 dexterity = ((_randomNumber % 10000) / 100 );
    uint256 constitution = ((_randomNumber % 1000000) / 10000 );
    uint256 intelligence = ((_randomNumber % 100000000) / 1000000 );
    uint256 wisdom = ((_randomNumber % 10000000000) / 100000000 );
    uint256 charisma = ((_randomNumber % 1000000000000) / 10000000000);
    uint256 experience = 0;
    uint256 heroId = (_randomNumber % 5);
    string memory name = requestIdToCharacterName[_requestId];


    characters.push(
      Character(
        strength,
        dexterity,
        constitution,
        intelligence,
        wisdom,
        charisma,
        experience,
        name,
        heroId
      )
    );

    _safeMint(owner, tokenId);
    emit Minted(owner, tokenId);
  }

  function setURI(uint256 _tokenId, string memory _tokenURI) public {
    require(
        _isApprovedOrOwner(_msgSender(), _tokenId),
        "ERC721: transfer caller is not owner nor approved"
    );
    _setTokenURI(_tokenId, _tokenURI);
  }

  /*********GETTERS**********/

  function getURI(uint256 _tokenId) public view returns(string memory) {
    return tokenURI(_tokenId);
  }

  function getNumberOfHeroes() public view returns (uint256) {
      return characters.length;
  }

  function getLevel(uint256 _tokenId) public view returns (uint256) {
      return sqrt(characters[_tokenId].experience);
  }

  function sqrt(uint256 x) internal pure returns (uint256 y) {
       uint256 z = (x + 1) / 2;
       y = x;
       while (z < y) {
           y = z;
           z = (x / z + z) / 2;
       }
   }

  function getHeroOverView(uint256 _tokenId)
        public
        view
        returns (
            string memory,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            characters[_tokenId].name,
            characters[_tokenId].heroId,
            characters[_tokenId].strength + characters[_tokenId].dexterity + characters[_tokenId].constitution + characters[_tokenId].intelligence + characters[_tokenId].wisdom + characters[_tokenId].charisma,
            getLevel(_tokenId),
            characters[_tokenId].experience
        );
    }


  function getHeroStats(uint256 _tokenId)
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            characters[_tokenId].strength,
            characters[_tokenId].dexterity,
            characters[_tokenId].constitution,
            characters[_tokenId].intelligence,
            characters[_tokenId].wisdom,
            characters[_tokenId].charisma,
            characters[_tokenId].experience
        );
    }

}

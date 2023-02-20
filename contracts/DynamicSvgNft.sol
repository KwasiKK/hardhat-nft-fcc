// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

error DynamicSvgNft__NonExistentToken();

contract DynamicSvgNft is ERC721 {
    // NFT Vars
    uint256 private s_tokenCounter;
    string private s_lowImageURI;
    string private s_highImageURI;
    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint256 => int256) public s_tokenIdToHighValues;
    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(
        address priceFeedAddress,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
        s_lowImageURI = svgToImageIri(lowSvg);
        s_highImageURI = svgToImageIri(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function svgToImageIri(string memory svg) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function mintNft(int256 highValue) public {
        s_tokenCounter += 1;
        s_tokenIdToHighValues[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        emit CreatedNFT(s_tokenCounter, highValue);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) {
            revert DynamicSvgNft__NonExistentToken();
        }
        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = s_lowImageURI;
        if (price >= s_tokenIdToHighValues[tokenId]) {
            imageURI = s_highImageURI;
        }
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(), // You can add whatever name here
                                '", "description":"An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}

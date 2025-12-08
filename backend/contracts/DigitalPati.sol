// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DigitalPati is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // ADMIN ÜCRETİ (Örn: 0.001 ETH)
    uint256 public constant LOST_REPORT_FEE = 0.001 ether;

    struct PetData {
        bool isLost;
        string contactInfo;
    }

    mapping(uint256 => PetData) public pets;

    // Events
    event PetMinted(uint256 indexed tokenId, address owner);
    event PetStatusChanged(uint256 indexed tokenId, bool isLost);
    event FeePaid(address from, uint256 amount);

    constructor() ERC721("DijitalPati", "PATI") Ownable(msg.sender) {}

    function mintPet(string memory tokenURI, string memory contactInfo) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        pets[tokenId] = PetData({
            isLost: false,
            contactInfo: contactInfo
        });

        emit PetMinted(tokenId, msg.sender);
        return tokenId;
    }

    // ARTIK BU FONKSİYON PARA İSTİYOR (PAYABLE)
    function toggleLostStatus(uint256 tokenId) public payable {
        require(ownerOf(tokenId) == msg.sender, "Sadece sahibi degistirebilir");
        
        PetData storage pet = pets[tokenId];

        // Eğer durum "Güvende" -> "Kayıp" olacaksa ÜCRET AL
        if (!pet.isLost) {
            require(msg.value >= LOST_REPORT_FEE, "Yetersiz islem ucreti! (0.001 ETH)");
            
            // Parayı Admin'e (Sözleşme Sahibi) gönder
            payable(owner()).transfer(msg.value);
            emit FeePaid(msg.sender, msg.value);
        }

        // Durumu değiştir
        pet.isLost = !pet.isLost;
        emit PetStatusChanged(tokenId, pet.isLost);
    }

    function updateContactInfo(uint256 tokenId, string memory newContactInfo) public {
        require(ownerOf(tokenId) == msg.sender, "Yetkisiz islem");
        pets[tokenId].contactInfo = newContactInfo;
    }

    function getPetStatus(uint256 tokenId) public view returns (bool isLost, string memory contactInfo) {
        _requireOwned(tokenId);
        PetData memory data = pets[tokenId];
        return (data.isLost, data.contactInfo);
    }
}
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("\x1b[36m%s\x1b[0m", "🚀 Backend Kurulum Robotu Başlatılıyor...");

// --- DOSYA İÇERİKLERİ ---

const packageJson = {
  "name": "dijital-pati-backend",
  "version": "1.0.0",
  "type": "module",
  "description": "Dijital Pati Blockchain Backend",
  "scripts": {
    "test": "hardhat test",
    "compile": "hardhat compile"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "hardhat": "^2.22.3"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.2",
    "dotenv": "^16.4.5"
  }
};

const hardhatConfig = `import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.20",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};

export default config;`;

const smartContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DigitalPati is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct PetData {
        bool isLost;
        string contactInfo;
    }

    mapping(uint256 => PetData) public pets;

    event PetMinted(uint256 indexed tokenId, address owner);
    event PetStatusChanged(uint256 indexed tokenId, bool isLost);

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

    function toggleLostStatus(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Yetkiniz yok");
        pets[tokenId].isLost = !pets[tokenId].isLost;
        emit PetStatusChanged(tokenId, pets[tokenId].isLost);
    }

    function updateContactInfo(uint256 tokenId, string memory newContactInfo) public {
        require(ownerOf(tokenId) == msg.sender, "Yetkiniz yok");
        pets[tokenId].contactInfo = newContactInfo;
    }

    function getPetStatus(uint256 tokenId) public view returns (bool isLost, string memory contactInfo) {
        _requireOwned(tokenId);
        PetData memory data = pets[tokenId];
        return (data.isLost, data.contactInfo);
    }
}
`;

// --- İŞLEMLER ---

try {
    // 1. package.json oluştur
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log("✅ package.json oluşturuldu.");

    // 2. hardhat.config.js oluştur
    fs.writeFileSync('hardhat.config.js', hardhatConfig);
    console.log("✅ hardhat.config.js oluşturuldu.");

    // 3. contracts klasörü ve DigitalPati.sol oluştur
    if (!fs.existsSync('contracts')) {
        fs.mkdirSync('contracts');
    }
    fs.writeFileSync(path.join('contracts', 'DigitalPati.sol'), smartContract);
    console.log("✅ DigitalPati.sol akıllı sözleşmesi yazıldı.");

    // 4. Kütüphaneleri Yükle (npm install)
    console.log("\n📦 Kütüphaneler indiriliyor (İnternet hızına göre 1-2 dk sürebilir)...");
    execSync('npm install', { stdio: 'inherit' });
    console.log("✅ Kurulum tamamlandı.");

    // 5. Derle (Compile)
    console.log("\n🔨 Akıllı sözleşme derleniyor...");
    execSync('npx hardhat compile', { stdio: 'inherit' });
    
    console.log("\n\x1b[32m%s\x1b[0m", "🎉 TEBRİKLER! Backend kurulumu ve derleme başarıyla bitti!");

} catch (error) {
    console.error("\n❌ Bir hata oluştu:", error.message);
}
import hre from "hardhat";

async function main() {
  console.log("🚀 DigitalPati Contract Deploy Ediliyor...\n");

  // Contract'ı deploy et
  const DigitalPati = await hre.ethers.getContractFactory("DigitalPati");
  const digitalPati = await DigitalPati.deploy();

  // Deploy işleminin tamamlanmasını bekle
  await digitalPati.waitForDeployment();

  const contractAddress = await digitalPati.getAddress();

  console.log("\n" + "=".repeat(60));
  console.log("✅ Contract Başarıyla Deploy Edildi!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("=".repeat(60));
  console.log("\n📋 ŞİMDİ YAPMANIZ GEREKENLER:");
  console.log("   1. Bu adresi kopyalayın: " + contractAddress);
  console.log("   2. frontend/utils/constants.ts dosyasını açın");
  console.log("   3. CONTRACT_ADDRESS değerini yukarıdaki adresle değiştirin");
  console.log("\n💡 Hardhat Local Node'u çalıştırmak için:");
  console.log("   cd backend");
  console.log("   npx hardhat node");
  console.log("\n💡 Bu script'i çalıştırmak için (yeni terminal):");
  console.log("   cd backend");
  console.log("   npx hardhat run scripts/deploy.js --network localhost");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deploy Hatası:", error);
    process.exit(1);
  });


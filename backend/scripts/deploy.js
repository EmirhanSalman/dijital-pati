import hre from "hardhat";

async function main() {
  // 1. Kontrat fabrikasını al
  const DigitalPati = await hre.ethers.getContractFactory("DigitalPati");

  // 2. Deploy et
  console.log("Deploying DigitalPati...");
  const digitalPati = await DigitalPati.deploy();

  // 3. İşlemin bitmesini bekle
  await digitalPati.waitForDeployment();

  // 4. Adresi yazdır
  console.log("DigitalPati deployed to:", await digitalPati.getAddress());
}

// Hata yakalama
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


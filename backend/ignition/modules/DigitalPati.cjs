const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DigitalPatiModule", (m) => {
  const token = m.contract("DigitalPati");
  return { token };
});
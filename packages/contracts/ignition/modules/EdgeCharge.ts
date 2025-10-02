import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


export default buildModule("EdgeChargeModule", (m) => {
  const edgeCharge = m.contract("EdgeCharge");
  
  // Authorizing a relayer
  m.call(edgeCharge, "authorizeRelayer", ["0x18a3E920DBF5A8dd58756CeA29308799c91f0536"]);

  return { edgeCharge };
});



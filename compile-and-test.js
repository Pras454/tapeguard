const fs = require("fs");
const solc = require("/home/hatch/workspace/our-launch/node_modules/solc");
const { ethers } = require("/home/hatch/workspace/our-launch/node_modules/ethers");

const source = fs.readFileSync(__dirname + "/TapeGuardRegistry.sol", "utf8");
const input = {
  language: "Solidity",
  sources: { "TapeGuardRegistry.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
if (out.errors) {
  const fatal = out.errors.filter((e) => e.severity === "error");
  if (fatal.length) {
    console.error(fatal.map((e) => e.formattedMessage).join("\n"));
    process.exit(1);
  }
}
const c = out.contracts["TapeGuardRegistry.sol"]["TapeGuardRegistry"];
fs.writeFileSync(
  __dirname + "/build.json",
  JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2)
);
console.log("compiled ok, bytecode bytes:", c.evm.bytecode.object.length / 2);

(async () => {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = await provider.getSigner(0);
  const factory = new ethers.ContractFactory(c.abi, "0x" + c.evm.bytecode.object, wallet);
  const reg = await factory.deploy();
  await reg.waitForDeployment();
  const addr = await reg.getAddress();
  console.log("deployed local:", addr);

  const processor = "0xb57b56034e2dc25161e2512CfC40b24EA3bee1Fb";
  const tx = await reg.recordReceipt(processor, 1, "0x0000", "0x01", 74000000);
  const rcpt = await tx.wait();
  console.log("record tx:", rcpt.hash);
  const count = await reg.receiptCount();
  console.log("receiptCount:", count.toString());
  const r = await reg.getReceipt(0);
  console.log("receipt0 circuitId:", r.circuitId.toString(), "hash:", r.receiptHash);
  const h = await reg.computeReceiptHash(processor, 1, "0x0000", "0x01", 74000000);
  console.log("hash match:", h === r.receiptHash);
  if (count.toString() !== "1" || h !== r.receiptHash) process.exit(1);
  console.log("ALL TESTS PASS");
})();

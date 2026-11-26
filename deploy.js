const fs = require("fs");
const { ethers } = require("/home/hatch/workspace/our-launch/node_modules/ethers");

const build = JSON.parse(fs.readFileSync(__dirname + "/build.json", "utf8"));
const key = JSON.parse(
  fs.readFileSync(
    "/home/hatch/workspace/goals/okx-x-layer-tapeout-accelerate/hidden_files/testnet-deployer.json",
    "utf8"
  )
);

(async () => {
  const provider = new ethers.JsonRpcProvider("https://testrpc.xlayer.tech");
  const wallet = new ethers.Wallet(key.privateKey, provider);
  const bal = await provider.getBalance(wallet.address);
  console.log("deployer:", wallet.address, "balance wei:", bal.toString());
  if (bal === 0n) {
    console.error("No testnet OKB yet");
    process.exit(1);
  }
  const factory = new ethers.ContractFactory(build.abi, build.bytecode, wallet);
  const reg = await factory.deploy();
  await reg.waitForDeployment();
  const addr = await reg.getAddress();
  console.log("registry deployed:", addr);
  console.log("deploy tx:", reg.deploymentTransaction().hash);

  // Anchor two sample receipts using live mainnet evaluations.
  const mainnet = new ethers.JsonRpcProvider("https://rpc.xlayer.tech");
  const processor = "0xb57b56034e2dc25161e2512CfC40b24EA3bee1Fb";
  const proc = new ethers.Contract(
    processor,
    ["function eval(uint256 tokenId, bytes input) view returns (bytes)"],
    mainnet
  );
  const block = await mainnet.getBlockNumber();
  console.log("mainnet block:", block);
  for (const [circuitId, input] of [
    [1, "0x0000"],
    [4, "0xffff"],
  ]) {
    const output = await proc.eval(circuitId, input);
    const tx = await reg.recordReceipt(processor, circuitId, input, output, block);
    const rcpt = await tx.wait();
    console.log(
      "receipt circuit",
      circuitId,
      "input",
      input,
      "output",
      output,
      "tx",
      rcpt.hash
    );
  }
  console.log("receiptCount:", (await reg.receiptCount()).toString());
  fs.writeFileSync(
    __dirname + "/deployment.json",
    JSON.stringify({ registry: addr, chainId: 1952, mainnetBlock: block }, null, 2)
  );
})();

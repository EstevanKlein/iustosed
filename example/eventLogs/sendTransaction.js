const fs = require("fs");
const path = require("path");
const Web3 = require("web3");

const { network, orion } = require("../keys");
const Web3Quorum = require("../../src");

const artifact = fs.readFileSync(
  path.join(__dirname, "../solidity/EventEmitter/EventEmitter.json")
);
const { abi } = JSON.parse(artifact).output;
const params = JSON.parse(fs.readFileSync(path.join(__dirname, "params.json")));

const node = new Web3Quorum(new Web3(network.node1.url));

async function run() {
  const { privacyGroupId, contractAddress } = params;
  const enclaveKey = orion.node1.publicKey;

  // send a transaction
  const args = process.argv.slice(2);
  const value = args.shift() || 3;

  const to = contractAddress;
  const contract = new node.eth.Contract(abi);

  const writeReceipt = await node.priv
    .generateAndSendRawTransaction({
      to,
      data: contract.methods.store([value]).encodeABI(),
      privateFrom: enclaveKey,
      privacyGroupId,
      privateKey: network.node1.privateKey,
    })
    .then((transactionHash) => {
      return node.priv.waitForTransactionReceipt(transactionHash);
    });

  console.log(writeReceipt);
}

run();

const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const Web3Quorum = require("../../src");

const { network, orion } = require("../keys");
const { createHttpProvider } = require("../helpers.js");

// use an orion key that is not a member of the group (eg orion.node11.jwt)
// to demonstrate that they can't create a subscription
const node = new Web3Quorum(
  new Web3(createHttpProvider(orion.node11.jwt, network.node1.url))
);
const params = JSON.parse(fs.readFileSync(path.join(__dirname, "params.json")));

async function run() {
  const { privacyGroupId, contractAddress: address, blockNumber } = params;

  const filter = {
    address,
    fromBlock: blockNumber,
  };

  console.log("Installing filter", filter);

  // Create subscription
  return node.priv
    .subscribeWithPooling(privacyGroupId, filter, (error, result) => {
      if (!error) {
        console.log("Installed filter", result);
      } else {
        console.error("Problem installing filter:", error);
        throw error;
      }
    })
    .then(async (subscription) => {
      // Add handlers for incoming events
      subscription
        .on("data", (log) => {
          if (log.result != null) {
            // Logs from subscription are nested in `result` key
            console.log("LOG =>", log.result);
          } else {
            console.log("LOG =>", log);
          }
        })
        .on("error", console.error);

      // Unsubscribe and disconnect on interrupt
      process.on("SIGINT", async () => {
        console.log("unsubscribing");
        await subscription.unsubscribe((error, success) => {
          if (!error) {
            console.log("Unsubscribed:", success);
          } else {
            console.error("Failed to unsubscribe:", error);
          }

          node.currentProvider.disconnect();
        });
      });

      return subscription;
    })
    .catch((error) => {
      console.error(error);
    });
}

run();

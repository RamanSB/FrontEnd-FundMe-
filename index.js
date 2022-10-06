import { ethers } from "./ethers-5.6.esm.min.js";
import { FUND_ME_ABI, FUND_ME_CONTRACT_ADDRESS } from "./constants.js";

console.log(`Printing the ethers object...`);
console.log(ethers);

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");
connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

async function connect() {
  console.log(`Button has been clicked`);
  if (typeof window.ethereum !== "undefined") {
    let response = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    console.log(response);
    connectButton.innerHTML = "Connected";
    console.log(`Connected`);
  } else {
    connectButton.innerHTML = "Please Install Metamask";
  }
}

async function fund() {
  console.log(`Cicked Fund`);
  // funding the contract
  // in order to access the contract we will need the providers object.
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    // contractAddress address, contract interface (abi), signer/provider
    const fundMeContract = new ethers.Contract(
      FUND_ME_CONTRACT_ADDRESS,
      FUND_ME_ABI,
      signer
    );
    let ethAmount = document.getElementById("fundingInput").value;
    if (ethAmount === "") {
      console.log(`No ETH amount entered, defaulting to 0.1 ETH...`);
      ethAmount = "0.1";
    }
    try {
      console.log(`Funding with ${ethAmount} ETH...`);
      const txnResponse = await fundMeContract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });

      await listenForTransactionMine(txnResponse, provider);
      console.log(
        `We have successfully funded our contract: ${fundMeContract.address}`
      );
      // we want to listen to an event whereby the txnResponse is complete.
    } catch (e) {
      console.log(`An error occurred: ${e}`);
    }
  }
}

function listenForTransactionMine(txnResponse, provider) {
  console.log(`Mining ${txnResponse.hash}...`);
  // listen for this transaction to finish...
  return new Promise((resolve, reject) => {
    try {
      provider.once(txnResponse.hash, (transactionReceipt) => {
        console.log(
          `Completed with ${transactionReceipt.confirmations} confirmations.`
        );
        resolve();
      });
    } catch (e) {
      reject();
    }
  });
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    console.log(signer);
    const signerAddress = await signer.getAddress();
    console.log(`Fetching balance for ${signerAddress}...`);
    const balance = await signer.getBalance();
    console.log(`Signer balance: ${ethers.utils.formatEther(balance)} ETH`);
    const addressBalance = await provider.getBalance(FUND_ME_CONTRACT_ADDRESS);
    console.log(
      `Address Balance: ${ethers.utils.formatEther(addressBalance)} ETH`
    );
    return addressBalance;
  }
}

async function withdraw() {
  if (typeof window.ethereum !== "undefined") {
    // get the contract...
    // need a signer... can get via provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const fundMeContract = new ethers.Contract(
      FUND_ME_CONTRACT_ADDRESS,
      FUND_ME_ABI,
      signer
    );
    try {
      console.log("Attempting to withdraw...");
      let txnResponse = await fundMeContract.withdraw();
      await listenForTransactionMine(txnResponse, provider);
      console.log(`Successfully withdrawn funds from FundMe contract.`);
    } catch (e) {
      console.log(e);
    }
  }
}

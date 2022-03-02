import dotenv from "dotenv";
dotenv.config();
import {
  AccountId,
  Client,
  ContractExecuteTransaction,
  //  ContractFunctionParameters,
  PrivateKey,
} from "@hashgraph/sdk";
// import { BuildParams } from "./buildParams";
//const Web3 = require("web3");
//import web3 from "web3";
//import fs from "fs";
import * as fs from "fs";
import Web3 from "web3";

const web3 = new Web3();

if (!process.env.ABI) {
  throw new Error("Need ABI in env file");
}
const abiPath = process.env.ABI;
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
console.log(abi);

async function main() {
  //   setupEvents();

  // Retrieve account info from .env
  const operatorId = AccountId.fromString(
    process.env.OPERATOR_ID.replace('"', "")
  );
  const operatorKey = PrivateKey.fromString(
    process.env.OPERATOR_PVKEY.replace('"', "")
  );

  // Configure Hedera network and build client
  const network = process.env.NETWORK.toLowerCase();

  let client: Client;

  if (network === "testnet") {
    client = Client.forTestnet().setOperator(operatorId, operatorKey);
  } else if (network === "mainnet") {
    client = Client.forMainnet().setOperator(operatorId, operatorKey);
  } else {
    throw new Error(
      `❌The Hedera network you entered is not valid. (Please enter either "Testnet" or "Mainnet")❌`
    );
  }

  const Args = process.argv.slice(2);
  console.log(`Args: ${Args}`);

  if (!process.env.CONTRACT_GAS) {
    throw new Error("Need GAS in env file");
  }
  const gas = Number(process.env.CONTRACT_GAS);

  if (!process.env.CONTRACT_ID) {
    throw new Error("Need CONTRACT_ID in env file");
  }
  const contractId = process.env.CONTRACT_ID;
  console.log(`Using contractId: ${contractId}`);

  if (!process.env.FUNCTION_NAME) {
    throw new Error("Need FUNCTION_NAME in env file");
  }
  const funcName = process.env.FUNCTION_NAME;
  console.log(`Using funcName: ${funcName}`);

  //------Parse constructor parameters and create string-----
  if (!process.env.FUNCTION_PARAMS) {
    throw new Error("Need FUNCTION_PARAMS in env file");
  }
  const funcParams = process.env.FUNCTION_PARAMS;
  console.log(`Using params: ${funcParams}`);

  //   let funcParams: ContractFunctionParameters;
  //   if (params) {
  //     funcParams = BuildParams(params);
  //   } else {
  //     funcParams = new ContractFunctionParameters();
  //   }

  //   .setFunction(funcName, funcParams)
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setFunctionParameters(encodeFunctionCall(funcName, [funcParams]))
    .setGas(gas)
    .execute(client);

  //   const resp = await tx.execute(client);
  //   const receipt = await resp.getReceipt(client);
  //   console.log(`The transaction status was: ${receipt.status}`);

  const record = await tx.getRecord(client);
  //  console.log(record);

  if (record && record.contractFunctionResult) {
    record.contractFunctionResult.logs.forEach((log) => {
      // convert the log.data (uint8Array) to a string
      let logStringHex = "0x".concat(Buffer.from(log.data).toString("hex"));

      // get topics from log
      let logTopics: string[] = [];
      log.topics.forEach((topic) => {
        logTopics.push("0x".concat(Buffer.from(topic).toString("hex")));
      });

      // decode the event data
      const event = decodeEvent(
        "CreateMainEvent",
        logStringHex,
        logTopics.slice(1)
      );
      console.log(event);

      // output the from address stored in the event
      console.log(
        `Record event: mainContract = ${event.mainContract} | name = ${event.name} `
      );
    });
  }

  const txStatus = record.receipt.status;
  console.log(`The transaction status was: ${txStatus}`);
  //   console.log(Number(record.contractFunctionResult?.getUint256()));
}
main();

/**
 * Encodes a function call so that the contract's function can be executed or called
 * @param functionName the name of the function to call
 * @param parameters the array of parameters to pass to the function
 */
function encodeFunctionCall(functionName: string, parameters: string[]) {
  const functionAbi = abi.find(
    (func: any) => func.name === functionName && func.type === "function"
  );
  const encodedParametersHex = web3.eth.abi
    .encodeFunctionCall(functionAbi, parameters)
    .slice(2);
  return Buffer.from(encodedParametersHex, "hex");
}

/**
 * Decodes event contents using the ABI definition of the event
 * @param eventName the name of the event
 * @param log log data as a Hex string
 * @param topics an array of event topics
 */
function decodeEvent(eventName: string, log: string, topics: string[]) {
  const eventAbi = abi.find(
    (event: any) => event.name === eventName && event.type === "event"
  );
  const decodedLog = web3.eth.abi.decodeLog(eventAbi.inputs, log, topics);
  return decodedLog;
}

/* 
	Working .env file 
*/
// #Client variables
// OPERATOR_ID = ... #REQUIRED
// OPERATOR_PVKEY =  ...  #REQUIRED
// NETWORK = "Testnet"                         #REQUIRED

// #Create & Append File variables (KEYS must at least contain operator key)
// KEYS = "[...]"     #REQUIRED
// #BIN =        #REQUIRED
// FILE_MEMO
// EXPIRATION_DAYS

// #Create Contract variables
// CONTRACT_GAS = "100000"                     #REQUIRED
// INITIAL_HBAR_BALANCE
// ADMIN_KEY
// PROXY_ACCOUNT_ID
// CONTRACT_MEMO

// ##Example.sol
// #BIN = "./src/example_contracts/bin/src_example_contracts_Example_sol_LookupContract.bin"
// #ABI = "./src/contracts/abi/src_example_contracts_Example_sol_LookupContract.abi"
// #CONSTRUCTOR_PARAMS = "{"0": ["string", "Alice"], "1": ["uint256", "1234567"]}"
// #FUNCTION_NAME = "getMobileNumber"
// #FUNCTION_PARAMS = "{"0": ["string", "Alice"]}"
// #CONTRACT_ID = 0.0.30827691
// #CONTRACT_ADDRESS = 0000000000000000000000000000000001d664ab # Example.sol

// #Factory.sol
// BIN = "./src/contracts/bin/src_contracts_Factory_sol_Factory.bin"    #REQUIRED
// ABI = "./src/contracts/abi/src_contracts_Factory_sol_Factory.abi"
// CONSTRUCTOR_PARAMS # = "{"0": ["string", "Alice"], "1": ["uint256", "1234567"]}"
// FUNCTION_NAME = "createMain"
// #FUNCTION_PARAMS = "{"0": ["string", "MainContract"]}"
// FUNCTION_PARAMS = "Main"
// CONTRACT_ID = 0.0.30840704
// CONTRACT_ADDRESS = 0000000000000000000000000000000001d69780

// function setupEvents() {
//   if (!process.env.CONTRACT_ADDRESS) {
//     throw new Error("Need CONTRACT_ADDRESS in env file");
//   }
//   const contractAddress = process.env.CONTRACT_ADDRESS;
//   console.log(`Using contractAddres: ${contractAddress}`);

//   if (!process.env.ABI) {
//     throw new Error("Need ABI in env file");
//   }
//   const abiPath = process.env.ABI;
//   console.log(`Using abiPath: ${abiPath}`);

//   const FactoryAbi = JSON.parse(fs.readFileSync(abiPath).toString());
//   console.log(FactoryAbi);
//   const ClientReceipt = web3.eth.contract(FactoryAbi);
//   const clientReceiptContract = ClientReceipt.at(contractAddress);

//   const event = clientReceiptContract.CreateMainEvent(function (
//     error: any,
//     result: any
//   ) {
//     if (!error) console.log(result);
//   });
//   console.log(event);
// }

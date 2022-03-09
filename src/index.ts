console.clear();
import dotenv from "dotenv";
dotenv.config();
import { AccountId, ContractId, PrivateKey } from "@hashgraph/sdk";
import { createDao } from "./create_dao";
import { callContractFunc, getClient } from "./utils";

async function full() {
  const treasuryId = AccountId.fromString(process.env.OPERATOR_ID);
  const treasuryKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
  const aliceId = AccountId.fromString(process.env.TRANSFER_TEST_ID);
  const aliceKey = PrivateKey.fromString(process.env.TRANSFER_TEST_PVKEY);
  const bobId = AccountId.fromString(process.env.BOB_ID);
  const bobKey = PrivateKey.fromString(process.env.BOB_PVKEY);
  const sallyId = AccountId.fromString(process.env.SALLY_ID);
  const sallyKey = PrivateKey.fromString(process.env.SALLY_PVKEY);
  const factoryBin = process.env.FACTORY_BIN;
  const factoryAbi = process.env.FACTORY_ABI;
  const daoBin = process.env.DAO_BIN;
  const daoAbi = process.env.DAO_ABI;
  const proxyBin = process.env.PROXY_BIN;
  const proxyAbi = process.env.PROXY_ABI;
  const network = process.env.NETWORK;
  const daoName = process.env.PROXY_NAME;
  const daoSymbol = process.env.PROXY_SYMBOL;
  const numOfficers = Number(process.env.NUM_OFFICERS);
  const numAdmins = Number(process.env.NUM_ADMINS);
  const numMembers = Number(process.env.NUM_MEMBERS);

  const [
    factoryContractId,
    implementationContractAddress,
    proxyContractAddress,
  ] = await createDao(
    treasuryId,
    treasuryKey,
    network,
    factoryBin,
    factoryAbi,
    daoName,
    daoSymbol,
    numOfficers,
    numAdmins,
    numMembers
  );
  console.log(
    factoryContractId,
    implementationContractAddress,
    proxyContractAddress
  );
}

async function test() {
  const treasuryId = AccountId.fromString(process.env.OPERATOR_ID);
  const treasuryKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
  const network = process.env.NETWORK;

  const client = getClient(treasuryId, treasuryKey, network);

  const factoryId = ContractId.fromString(process.env.FACTORY_ID);
  const factoryAbi = process.env.FACTORY_ABI;
  const factoryFuncName = process.env.FACTORY_FUNC_NAME;
  const factoryFuncParams = JSON.parse(process.env.FACTORY_FUNC_PARAMS);

  callContractFunc(
    factoryId,
    factoryAbi,
    factoryFuncName,
    factoryFuncParams,
    client
  );

  const impId = ContractId.fromString(process.env.IMP_ID);
  const impAbi = process.env.IMP_ABI;
  const impFuncName = process.env.IMP_FUNC_NAME;
  const impFuncParams = JSON.parse(process.env.IMP_FUNC_PARAMS);

  callContractFunc(impId, impAbi, impFuncName, impFuncParams, client);

  const proxyId = ContractId.fromString(process.env.PROXY_ID);
  const proxyAbi = process.env.PROXY_ABI;
  const proxyFuncName = process.env.PROXY_FUNC_NAME;
  const proxyFuncParams = JSON.parse(process.env.PROXY_FUNC_PARAMS);

  callContractFunc(proxyId, proxyAbi, proxyFuncName, proxyFuncParams, client);
}

function main() {
  const Args = process.argv.slice(2);
  console.log(`Args: ${Args}`);

  switch (Args[0]) {
    case "test":
      test();
      break;
    case "full":
      full();
      break;
    default:
      console.log("Unsupported argument");
      break;
  }
}
main();

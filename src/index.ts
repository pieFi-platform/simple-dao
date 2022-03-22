console.clear();
import dotenv from "dotenv";
dotenv.config();
import {
  AccountBalanceQuery,
  AccountId,
  ContractId,
  Hbar,
  TokenId,
  TransferTransaction,
  PrivateKey,
} from "@hashgraph/sdk";
import {
  createDao,
  grantAccess,
  removeAccess,
  mintTokens,
  checkBalances,
} from "./create_dao";
import { callContractFunc, getClient } from "./utils";

const treasuryId = AccountId.fromString(process.env.OPERATOR_ID);
const treasuryKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const aliceId = AccountId.fromString(process.env.TRANSFER_TEST_ID);
const aliceKey = PrivateKey.fromString(process.env.TRANSFER_TEST_PVKEY);
const bobId = AccountId.fromString(process.env.BOB_ID);
const bobKey = PrivateKey.fromString(process.env.BOB_PVKEY);
const sallyId = AccountId.fromString(process.env.SALLY_ID);
const sallyKey = PrivateKey.fromString(process.env.SALLY_PVKEY);
const daoBin = process.env.DAO_BIN;
const daoAbi = process.env.DAO_ABI;
const proxyBin = process.env.PROXY_BIN;
const network = process.env.NETWORK;
const daoName = process.env.PROXY_NAME;
const daoSymbol = process.env.PROXY_SYMBOL;
const numOfficers = Number(process.env.NUM_OFFICERS);
const numAdmins = Number(process.env.NUM_ADMINS);
const numMembers = Number(process.env.NUM_MEMBERS);

const client = getClient(treasuryId, treasuryKey, network);

const factoryId = ContractId.fromString(process.env.FACTORY_ID);
const impId = ContractId.fromString(process.env.IMP_ID);
const proxyId = ContractId.fromString(process.env.PROXY_ID);

const factoryBin = process.env.FACTORY_BIN;
const factoryAbi = process.env.FACTORY_ABI;
const factoryFuncName = process.env.FACTORY_FUNC_NAME;
const factoryFuncParams = JSON.parse(process.env.FACTORY_FUNC_PARAMS);

const impAbi = process.env.IMP_ABI;
const impFuncName = process.env.IMP_FUNC_NAME;
const impFuncParams = JSON.parse(process.env.IMP_FUNC_PARAMS);
const impTokenOfficerId = TokenId.fromString(process.env.IMP_OFFICER_ID);
const impTokenAdminId = TokenId.fromString(process.env.IMP_ADMIN_ID);
const impTokenMemberId = TokenId.fromString(process.env.IMP_MEMBER_ID);

const proxyAbi = process.env.PROXY_ABI;
const proxyFuncName = process.env.PROXY_FUNC_NAME;
const proxyFuncParams = JSON.parse(process.env.PROXY_FUNC_PARAMS);
const proxyTokenOfficerId = TokenId.fromString(process.env.PROXY_OFFICER_ID);
const proxyTokenAdminId = TokenId.fromString(process.env.PROXY_ADMIN_ID);
const proxyTokenMemberId = TokenId.fromString(process.env.PROXY_MEMBER_ID);

async function fullDeploy() {
  const [
    factoryContractId,
    implementationContractAddress,
    proxyContractAddress,
    impTokens,
    proxyTokens,
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
    proxyContractAddress,
    impTokens,
    proxyTokens
  );
}

async function getSender() {
  await callContractFunc(impId, impAbi, "getSender", [], client);

  await callContractFunc(proxyId, proxyAbi, "getSender", [], client);
}

async function getTreasury() {
  await callContractFunc(impId, impAbi, "getTreasury", [], client);

  await callContractFunc(proxyId, proxyAbi, "getTreasury", [], client);
}

async function delegateGetSender() {
  await callContractFunc(proxyId, proxyAbi, "delegateGetSender", [], client);
}

async function delegateGetTreasury() {
  await callContractFunc(proxyId, proxyAbi, "delegateGetTreasury", [], client);
}

async function testNoParam() {
  await callContractFunc(factoryId, factoryAbi, "testOnly", [], client);

  await callContractFunc(impId, impAbi, "testNoParam", [], client);

  await callContractFunc(proxyId, proxyAbi, "testNoParam", [], client);
}

async function testWithParam() {
  await callContractFunc(factoryId, factoryAbi, "testOnly", [], client);

  await callContractFunc(impId, impAbi, "testWithParam", ["TestImp"], client);

  await callContractFunc(
    proxyId,
    proxyAbi,
    "testWithParam",
    ["TestProxy"],
    client
  );
}

async function testAssociate() {
  await callContractFunc(factoryId, factoryAbi, "testOnly", [], client);

  const param = [`0x${aliceId.toSolidityAddress()}`];
  const keys = [treasuryKey, aliceKey];
  await callContractFunc(impId, impAbi, "testAssociate", param, client, keys);

  await callContractFunc(
    proxyId,
    proxyAbi,
    "testAssociate",
    param,
    client,
    keys
  );
}

async function testTransfer() {
  await callContractFunc(factoryId, factoryAbi, "testOnly", [], client);

  const param = [`0x${aliceId.toSolidityAddress()}`];
  const keys = [treasuryKey];
  await callContractFunc(impId, impAbi, "testTransfer", param, client, keys);

  await callContractFunc(
    proxyId,
    proxyAbi,
    "testTransfer",
    param,
    client,
    keys
  );
}

async function testAddAdmin() {
  await callContractFunc(factoryId, factoryAbi, "testOnly", [], client);

  const param = [`0x${aliceId.toSolidityAddress()}`];
  await callContractFunc(impId, impAbi, "testAddAdmin", param, client);

  await callContractFunc(proxyId, proxyAbi, "testAddAdmin", param, client);
}

async function balances() {
  console.log("Balances for Imp Contract:");
  await checkBalances(impTokenOfficerId, impTokenAdminId, impTokenMemberId);
  console.log("\nBalances for Proxy Contract:");
  await checkBalances(
    proxyTokenOfficerId,
    proxyTokenAdminId,
    proxyTokenMemberId
  );
}

async function grantAccessTest() {
  const tokenOfficerId = proxyTokenOfficerId;
  const tokenAdminId = proxyTokenAdminId;
  const tokenMemberId = proxyTokenMemberId;
  const contractId = proxyId;
  const contractAbi = proxyAbi;

  // const tokenOfficerId = impTokenOfficerId;
  // const tokenAdminId = impTokenAdminId;
  // const tokenMemberId = impTokenMemberId;
  // const contractId = impId;
  // const contractAbi = impAbi;

  await checkBalances(tokenOfficerId, tokenAdminId, tokenMemberId);
  await grantAccess(
    contractId,
    contractAbi,
    network,
    sallyId,
    sallyKey,
    aliceId,
    aliceKey,
    treasuryKey,
    "member",
    tokenMemberId
  );
  await checkBalances(tokenOfficerId, tokenAdminId, tokenMemberId);
}

async function removeAccessTest() {
  const tokenOfficerId = proxyTokenOfficerId;
  const tokenAdminId = proxyTokenAdminId;
  const tokenMemberId = proxyTokenMemberId;
  const contractId = proxyId;
  const contractAbi = proxyAbi;

  // const tokenOfficerId = impTokenOfficerId;
  // const tokenAdminId = impTokenAdminId;
  // const tokenMemberId = impTokenMemberId;
  // const contractId = impId;
  // const contractAbi = impAbi;
  await checkBalances(tokenOfficerId, tokenAdminId, tokenMemberId);
  await removeAccess(
    contractId,
    contractAbi,
    network,
    sallyId,
    sallyKey,
    aliceId,
    aliceKey,
    treasuryKey,
    "member",
    tokenMemberId
  );
  await checkBalances(tokenOfficerId, tokenAdminId, tokenMemberId);
}

async function mintTokensTest() {
  const tokenOfficerId = proxyTokenOfficerId;
  const tokenAdminId = proxyTokenAdminId;
  const tokenMemberId = proxyTokenMemberId;
  const contractId = proxyId;
  const contractAbi = proxyAbi;

  // const tokenOfficerId = impTokenOfficerId;
  // const tokenAdminId = impTokenAdminId;
  // const tokenMemberId = impTokenMemberId;
  // const contractId = impId;
  // const contractAbi = impAbi;
  await checkBalances(tokenOfficerId, tokenAdminId, tokenMemberId);
  await mintTokens(
    contractId,
    contractAbi,
    network,
    "member",
    10,
    treasuryId,
    treasuryKey
  );
  await checkBalances(tokenOfficerId, tokenAdminId, tokenMemberId);
}

async function sendHbar() {
  // const sendHbar = await new TransferTransaction()
  //   .addHbarTransfer(treasuryId, Hbar.fromTinybars(-1000000000))
  //   .addHbarTransfer(aliceId, Hbar.fromTinybars(1000000000))
  //   .execute(client);
  // const sendreceipt = await sendHbar.getReceipt(client);
  // console.log(
  //   "The transfer transaction from my account to the new account was: " +
  //     sendreceipt.status.toString()
  // );

  const query = await new AccountBalanceQuery()
    .setAccountId(aliceId)
    .execute(client);
  console.log(
    "The account balance after the transfer is: " +
      query.hbars.toTinybars() +
      " tinybar."
  );
}

function main() {
  const Args = process.argv.slice(2);
  console.log(`Args: ${Args}`);

  switch (Args[0]) {
    case "testNoParam":
      testNoParam();
      break;
    case "testWithParam":
      testWithParam();
      break;
    case "testAssociate":
      testAssociate();
      break;
    case "testTransfer":
      testTransfer();
      break;
    case "testAddAdmin":
      testAddAdmin();
      break;
    case "fullDeploy":
      fullDeploy();
      break;
    case "grantAccessTest":
      grantAccessTest();
      break;
    case "removeAccessTest":
      removeAccessTest();
      break;
    case "balances":
      balances();
      break;
    case "getSender":
      getSender();
      break;
    case "getTreasury":
      getTreasury();
      break;
    case "delegateGetSender":
      delegateGetSender();
      break;
    case "delegateGetTreasury":
      delegateGetTreasury();
      break;
    case "sendHbar":
      sendHbar();
      break;
    case "mintTokensTest":
      mintTokensTest();
      break;
    default:
      console.log("Unsupported argument");
      break;
  }
}
main();

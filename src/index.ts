console.clear();
import dotenv from "dotenv";
dotenv.config();
import {
	AccountBalanceQuery,
	AccountId,
	ContractId,
	Hbar,
	TransferTransaction,
	PrivateKey,
} from "@hashgraph/sdk";
import {
	createDaoFactory,
	grantAccess,
	removeAccess,
	removeOfficer,
	setMaxUsers,
	checkBalances,
	queryContractFunction,
	depositHbar,
	transferHbar,
} from "./create_dao";
import { getClient, queryContractFunc } from "./utils";

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
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

const client = getClient(operatorId, operatorKey, network);

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

const proxyAbi = process.env.PROXY_ABI;
const proxyFuncName = process.env.PROXY_FUNC_NAME;
const proxyFuncParams = JSON.parse(process.env.PROXY_FUNC_PARAMS);

async function fullDeploy() {
	const [
		factoryContractId,
		implementationContractAddress,
		proxyContractAddress,
		impTopic,
		proxyTopic,
	] = await createDaoFactory(
		operatorId,
		operatorKey,
		network,
		factoryBin,
		factoryAbi,
		daoName
	);
	// console.log(
	// 	factoryContractId,
	// 	implementationContractAddress,
	// 	proxyContractAddress,
	// 	impTopic,
	// 	proxyTopic
	// );
}

// async function getSender() {
//   await callContractFunc(impId, impAbi, "getSender", [], client);

//   await callContractFunc(proxyId, proxyAbi, "getSender", [], client);
// }

// async function getTreasury() {
//   await callContractFunc(impId, impAbi, "getTreasury", [], client);

//   await callContractFunc(proxyId, proxyAbi, "getTreasury", [], client);
// }

// async function delegateGetSender() {
//   await callContractFunc(proxyId, proxyAbi, "delegateGetSender", [], client);
// }

// async function delegateGetTreasury() {
//   await callContractFunc(proxyId, proxyAbi, "delegateGetTreasury", [], client);
// }

// async function testNoParam() {
//   await callContractFunc(factoryId, factoryAbi, "testOnly", [], client);

//   await callContractFunc(impId, impAbi, "testNoParam", [], client);

//   await callContractFunc(proxyId, proxyAbi, "testNoParam", [], client);
// }

// async function testWithParam() {
//   await callContractFunc(factoryId, factoryAbi, "testOnly", [], client);

//   await callContractFunc(impId, impAbi, "testWithParam", ["TestImp"], client);

//   await callContractFunc(
//     proxyId,
//     proxyAbi,
//     "testWithParam",
//     ["TestProxy"],
//     client
//   );
// }

async function balances() {
	console.log("Balances for Imp Contract:");
	await checkBalances(impId, impAbi);
	console.log("\nBalances for Proxy Contract:");
	await checkBalances(proxyId, proxyAbi);
}

async function grantAccessTest() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	await grantAccess(
		contractId,
		contractAbi,
		aliceId,
		aliceKey,
		network,
		[bobId],
		AccessType.Member
	);

	balances();
}

async function removeAccessTest() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	await removeAccess(contractId, contractAbi, sallyId, sallyKey, network, [
		aliceId,
	]);
	balances();
}

async function removeOfficerTest() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	await removeOfficer(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		sallyId
	);
	balances();
}

async function getMaxUserTest() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	const result = await queryContractFunction(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		"getMaxUsers"
	);
	console.log("Max users is: ", result?.getUint32());
}

async function getBalance() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	const result = await queryContractFunction(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		"getBalance"
	);
	console.log(
		"The contract Hbar balance is: ",
		result?.getUint256().toString()
	);
}

async function deposit() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	await depositHbar(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		new Hbar(1)
	);
	getBalance();
}

async function transfer() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	await transferHbar(
		contractId,
		contractAbi,
		aliceId,
		aliceKey,
		network,
		aliceId,
		1
	);
	getBalance();
}

async function setMaxUserTest() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	await setMaxUsers(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		15
	);

	getMaxUserTest();
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
		case "fullDeploy":
			fullDeploy();
			break;
		case "grantAccessTest":
			grantAccessTest();
			break;
		case "removeAccessTest":
			removeAccessTest();
			break;
		case "removeOfficerTest":
			removeOfficerTest();
			break;
		case "setMaxUserTest":
			setMaxUserTest();
			break;
		case "balances":
			balances();
			break;
		case "sendHbar":
			sendHbar();
			break;
		case "getMaxUserTest":
			getMaxUserTest();
			break;
		case "getBalance":
			getBalance();
			break;
		case "deposit":
			deposit();
			break;
		case "transfer":
			transfer();
			break;
		// case "testNoParam":
		// 	testNoParam();
		// 	break;
		// case "testWithParam":
		// 	testWithParam();
		// 	break;
		// case "getSender":
		// 	getSender();
		// 	break;
		// case "getTreasury":
		// 	getTreasury();
		// 	break;
		// case "delegateGetSender":
		// 	delegateGetSender();
		// 	break;
		// case "delegateGetTreasury":
		// 	delegateGetTreasury();
		// 	break;
	}
}
main();

console.clear();
import dotenv from "dotenv";
dotenv.config();
import {
	AccountBalanceQuery,
	AccountId,
	ContractId,
	Hbar,
	PrivateKey,
	TransferTransaction,
} from "@hashgraph/sdk";
import {
	createDaoFactory,
	depositHbar,
	grantAccess,
	queryContractFunction,
	removeAccess,
	removeOfficer,
	setMaxUsers,
	transferHbar,
	getUserAccess,
} from "./create_dao";
import { getClient } from "./utils";

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const aliceId = AccountId.fromString(process.env.TRANSFER_TEST_ID);
const aliceKey = PrivateKey.fromString(process.env.TRANSFER_TEST_PVKEY);
const bobId = AccountId.fromString(process.env.BOB_ID);
const sallyId = AccountId.fromString(process.env.SALLY_ID);
const network = process.env.NETWORK;
const daoName = process.env.PROXY_NAME;

const client = getClient(operatorId, operatorKey, network);

// const impId = ContractId.fromString(process.env.IMP_ID);
const proxyId = ContractId.fromString(process.env.PROXY_ID);

const factoryBin = process.env.FACTORY_BIN;
const factoryAbi = process.env.FACTORY_ABI;
// const impAbi = process.env.IMP_ABI;
const proxyAbi = process.env.PROXY_ABI;

async function fullDeploy() {
	await createDaoFactory(
		operatorId,
		operatorKey,
		network,
		factoryBin,
		factoryAbi,
		daoName
	);
}

async function createUsers() {
	// create users
	const userArrStr: string[] = [
		"0.0.34046922",
		"0.0.34046923",
		"0.0.34046924",
		"0.0.34046925",
		"0.0.34046926",
		"0.0.34046927",
		"0.0.34046928",
		"0.0.34046929",
		"0.0.34046930",
		"0.0.34046932",
		"0.0.34046933",
		"0.0.34046934",
		"0.0.34046935",
		"0.0.34046936",
		"0.0.34046937",
		"0.0.34046938",
		"0.0.34046939",
		"0.0.34046940",
		"0.0.34046941",
		"0.0.34046942",
		"0.0.34046943",
		"0.0.34046944",
		"0.0.34046945",
		"0.0.34046946",
		"0.0.34046947",
		"0.0.34046948",
		"0.0.34046949",
		"0.0.34046950",
		"0.0.34046951",
		"0.0.34046952",
		"0.0.34046953",
		"0.0.34046954",
		"0.0.34046955",
		"0.0.34046956",
		"0.0.34046957",
		"0.0.34046958",
		"0.0.34046959",
		"0.0.34046960",
		"0.0.34046961",
		"0.0.34046962",
		"0.0.34046963",
		"0.0.34046964",
		"0.0.34046965",
		"0.0.34046966",
		"0.0.34046967",
		"0.0.34046968",
		"0.0.34046969",
		"0.0.34046970",
		"0.0.34046971",
		"0.0.34046972",
		"0.0.34046984",
		"0.0.34046985",
		"0.0.34046986",
		"0.0.34046987",
		"0.0.34046988",
		"0.0.34046989",
		"0.0.34046990",
		"0.0.34046991",
		"0.0.34046992",
		"0.0.34046993",
		"0.0.34046994",
		"0.0.34046995",
		"0.0.34046996",
		"0.0.34046997",
		"0.0.34046998",
		"0.0.34046999",
		"0.0.34047000",
		"0.0.34047001",
		"0.0.34047002",
		"0.0.34047003",
		"0.0.34047004",
		"0.0.34047005",
		"0.0.34047006",
		"0.0.34047007",
		"0.0.34047008",
		"0.0.34047009",
		"0.0.34047010",
		"0.0.34047011",
		"0.0.34047012",
		"0.0.34047013",
		"0.0.34047014",
		"0.0.34047015",
		"0.0.34047016",
		"0.0.34047017",
		"0.0.34047018",
		"0.0.34047019",
		"0.0.34047020",
		"0.0.34047021",
		"0.0.34047022",
		"0.0.34047023",
		"0.0.34047024",
		"0.0.34047025",
		"0.0.34047026",
		"0.0.34047027",
		"0.0.34047028",
		"0.0.34047029",
		"0.0.34047030",
		"0.0.34047031",
		"0.0.34047032",
		"0.0.34047033",
		"0.0.34047034",
		"0.0.34047035",
		"0.0.34047036",
		"0.0.34047037",
		"0.0.34047038",
		"0.0.34047039",
		"0.0.34047040",
		"0.0.34047041",
		"0.0.34047042",
		"0.0.34047043",
		"0.0.34047044",
		"0.0.34047045",
		"0.0.34047046",
		"0.0.34047047",
		"0.0.34047048",
		"0.0.34047049",
		"0.0.34047050",
		"0.0.34047051",
		"0.0.34047052",
		"0.0.34047053",
		"0.0.34047054",
		"0.0.34047055",
		"0.0.34047056",
		"0.0.34047057",
		"0.0.34047058",
		"0.0.34047059",
		"0.0.34047060",
		"0.0.34047061",
		"0.0.34047062",
		"0.0.34047063",
		"0.0.34047064",
		"0.0.34047065",
		"0.0.34047066",
		"0.0.34047067",
		"0.0.34047068",
		"0.0.34047069",
		"0.0.34047070",
		"0.0.34047071",
		"0.0.34047072",
		"0.0.34047073",
		"0.0.34047074",
		"0.0.34047075",
		"0.0.34047076",
		"0.0.34047077",
		"0.0.34047078",
		"0.0.34047079",
		"0.0.34047080",
		"0.0.34047081",
		"0.0.34047082",
		"0.0.34047083",
		"0.0.34047084",
		"0.0.34047085",
		"0.0.34047086",
		"0.0.34047087",
		"0.0.34047088",
		"0.0.34047089",
		// "0.0.34047090",
		// "0.0.34047091",
		// "0.0.34047092",
		// "0.0.34047093",
		// "0.0.34047094",
		// "0.0.34047095",
		// "0.0.34047096",
		// "0.0.34047097",
		// "0.0.34047098",
		// "0.0.34047099",
		// "0.0.34047100",
		// "0.0.34047101",
		// "0.0.34047102",
		// "0.0.34047103",
		// "0.0.34047104",
		// "0.0.34047105",
		// "0.0.34047106",
		// "0.0.34047107",
		// "0.0.34047108",
		// "0.0.34047109",
		// "0.0.34047110",
		// "0.0.34047111",
		// "0.0.34047112",
		// "0.0.34047113",
		// "0.0.34047114",
		// "0.0.34047115",
		// "0.0.34047116",
		// "0.0.34047117",
		// "0.0.34047118",
		// "0.0.34047119",
		// "0.0.34047120",
		// "0.0.34047121",
		// "0.0.34047122",
		// "0.0.34047123",
		// "0.0.34047124",
		// "0.0.34047125",
		// "0.0.34047126",
		// "0.0.34047127",
		// "0.0.34047128",
		// "0.0.34047129",
		// "0.0.34047130",
		// "0.0.34047131",
		// "0.0.34047132",
		// "0.0.34047133",
	];

	const userArr = userArrStr.map((account: string) =>
		AccountId.fromString(account)
	);
	// for (let i = 0; i < 150; i++) {
	// 	const privateKey = await PrivateKey.generate();
	// 	const accountTx = new AccountCreateTransaction().setKey(privateKey);
	// 	const response = await accountTx.execute(client);
	// 	const receipt = await response.getReceipt(client);
	// 	const accountId = receipt.accountId;
	// 	if (accountId) {
	// 		userArr.push(accountId);
	// 	}
	// }

	// grant access
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	await grantAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		userArr,
		AccessType.Member
	);

	// await balances();

	// console.log("\nHere are the new account balances: \n");
	console.log(`Successfully added ${userArr.length}`);
	// let count = 1;
	// for (const element of userArr) {
	// 	const accountAccess = await getUserAccess(
	// 		contractId,
	// 		contractAbi,
	// 		operatorId,
	// 		operatorKey,
	// 		network,
	// 		element
	// 	);
	// 	const accountType = accountAccess?.getUint256();
	// 	console.log(
	// 		`${count} - Account ${element} access type is: ${accountType}`
	// 	);
	// 	count++;
	// }
}

// async function balanceTest() {
// 	const contractId = proxyId;
// 	const contractAbi = proxyAbi;
// 	const accountAccess = await getUserAccess(
// 		contractId,
// 		contractAbi,
// 		operatorId,
// 		operatorKey,
// 		network,
// 		operatorId
// 	);
// 	const accountType = accountAccess?.getUint256();
// 	console.log(`Account ${operatorId} access type is: ${accountType}`);
// 	// await sendHbar();
// }

async function balances() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	const operatorAccess = await getUserAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		operatorId
	);
	const operatorType = operatorAccess?.getUint256();
	console.log(`Operator's access type is: ${operatorType}`);

	const aliceAccess = await getUserAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		aliceId
	);
	const aliceType = aliceAccess?.getUint256();
	console.log(`Alice's access type is: ${aliceType}`);

	const bobAccess = await getUserAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		bobId
	);
	const bobType = bobAccess?.getUint256();
	console.log(`Bob's access type is: ${bobType}`);

	const sallyAccess = await getUserAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		sallyId
	);
	const sallyType = sallyAccess?.getUint256();
	console.log(`Sally's access type is: ${sallyType}`);
}

async function grantAccessTest() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	await grantAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		[sallyId],
		AccessType.Admin
	);

	balances();
}

async function removeAccessTest() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	await removeAccess(contractId, contractAbi, aliceId, aliceKey, network, [
		bobId,
	]);
	await balances();
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
		operatorId
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
		new Hbar(0.0002)
	);
	getBalance();
}

async function transferHbarTest() {
	const contractId = proxyId;
	const contractAbi = proxyAbi;

	// const contractId = impId;
	// const contractAbi = impAbi;

	await transferHbar(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		aliceId,
		15
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
		200
	);

	getMaxUserTest();
}

async function sendHbar() {
	const sendHbar = await new TransferTransaction()
		.addHbarTransfer(operatorId, Hbar.fromTinybars(-1000000000))
		.addHbarTransfer(aliceId, Hbar.fromTinybars(1000000000))
		.execute(client);
	const sendreceipt = await sendHbar.getReceipt(client);
	console.log(
		"The transfer transaction from my account to the new account was: " +
			sendreceipt.status.toString()
	);

	accountBalance();
}

async function accountBalance() {
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
		case "accountBalance":
			accountBalance();
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
		case "transferHbarTest":
			transferHbarTest();
			break;
		case "createUsers":
			createUsers();
			break;
	}
}
main();

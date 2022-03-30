import {
	AccountId,
	Client,
	ContractCallQuery,
	ContractExecuteTransaction,
	ContractFunctionResult,
	ContractId,
	Hbar,
	PrivateKey,
	TopicCreateTransaction,
	TopicId,
} from "@hashgraph/sdk";
import * as fs from "fs";
import Web3 from "web3";

const web3 = new Web3();

/**
 * Decodes the result of a contract's function execution
 * @param functionName - the name of the function within the ABI
 * @param abiPath - the relative path for abi file of the contract
 * @param resultAsBytes - a byte array containing the execution result
 */
export function decodeFunctionResult(
	functionName: string,
	abiPath: string,
	resultAsBytes: Uint8Array
) {
	const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

	const functionAbi = abi.find((func: any) => func.name === functionName);
	const functionParameters = functionAbi.outputs;
	const resultHex = "0x".concat(Buffer.from(resultAsBytes).toString("hex"));
	const result = web3.eth.abi.decodeParameters(functionParameters, resultHex);
	return result;
}

/**
 * Encodes a function call so that the contract's function can be executed or called
 * @param functionName the name of the function to call
 * @param abiPath - the relative path for abi file of the contract
 * @param parameters the array of parameters to pass to the function
 */
export function encodeFunctionCall(
	functionName: string,
	abiPath: string,
	parameters: (string | string[])[]
) {
	const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

	const functionAbi = abi.find(
		(func: any) => func.name === functionName && func.type === "function"
	);
	const functionParams = functionAbi.inputs;

	const encodedParameters =
		web3.eth.abi.encodeFunctionSignature(functionAbi) +
		web3.eth.abi.encodeParameters(functionParams, parameters).slice(2);
	const encodedParametersHex = encodedParameters.slice(2);

	return Buffer.from(encodedParametersHex, "hex");
}

/**
 * Creates a Hedera client
 * @param operatorId - the AccountId for Account used to create the client
 * @param operatorKey - the PrivateKey for Account used to create the client
 * @param network - the network that the contract should be deployed on either: Testnet or Mainnet
 * @returns client - a Hedera client
 */
export function getClient(
	operatorId: AccountId | null = null,
	operatorKey: PrivateKey | null = null,
	network: string | null = null
): Client {
	// Retrieve account info from .env
	if (!operatorId && process.env.OPERATOR_ID) {
		operatorId = AccountId.fromString(
			process.env.OPERATOR_ID.replace('"', "")
		);
	}
	if (!operatorKey && process.env.OPERATOR_PVKEY) {
		operatorKey = PrivateKey.fromString(
			process.env.OPERATOR_PVKEY.replace('"', "")
		);
	}

	// Configure Hedera network and build client
	if (!network && process.env.NETWORK) {
		network = process.env.NETWORK.toLowerCase();
	}

	if (!operatorId || !operatorKey || !network) {
		throw new Error(
			`❌Bad arguments, cannot create a client with: ${operatorId}, ${operatorKey}, ${network}❌`
		);
	}

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
	return client;
}

/**
 * Calls a function on a smart contract that has previously been deployed to Hedera
 * @param contractId - the Hedera ContractId for the deployed contract that is being called
 * @param abiPath - the relative path for the abi file of the contract
 * @param funcName- name of the function to be called on the contract
 * @param funcParams - the function's parameters
 * @param client - the Hedera client that will sign the contract function call
 * @param keys - a list of Hedera PrivateKeys that are required to sign the contract function call
 * @param amount - amount of Hbar being transfered to the account if the function is payable
 * @returns result of the contract function call
 */
export async function callContractFunc(
	contractId: ContractId,
	abiPath: string,
	funcName: string,
	funcParams: (string | string[])[] | undefined,
	client: Client,
	keys: PrivateKey[] | null = null,
	amount: Hbar | null = null
): Promise<ContractFunctionResult | null> {
	let gas = 1000000;
	if (process.env.CONTRACT_GAS) {
		gas = Number(process.env.CONTRACT_GAS);
	}

	try {
		const tx = new ContractExecuteTransaction()
			.setContractId(contractId)
			.setFunctionParameters(
				encodeFunctionCall(
					funcName,
					abiPath,
					funcParams ? funcParams : []
				)
			)
			.setGas(gas);

		if (amount) {
			tx.setPayableAmount(amount);
		}
		tx.freezeWith(client);

		if (keys) {
			for (const key of keys) {
				await tx.sign(key);
				console.log("Sign successful");
			}
		}

		const response = await tx.execute(client);

		const record = await response.getRecord(client);

		return record.contractFunctionResult;
	} catch (err) {
		console.log(err);
		return null;
	}
}

/**
 * Queries a function on a smart contract that has previously been deployed to Hedera
 * @param contractId - the Hedera ContractId for the deployed contract that is being called
 * @param abiPath - the relative path for abi file of the contract
 * @param funcName- name of the function to be queried on the contract
 * @param funcParams - the function's parameters
 * @param client - the Hedera client that will sign the contract function query
 * @returns result of the contract function call
 */
export async function queryContractFunc(
	contractId: ContractId,
	abiPath: string,
	funcName: string,
	funcParams: string[] | undefined,
	client: Client
): Promise<ContractFunctionResult | null> {
	let gas = 100000;
	if (process.env.CONTRACT_GAS) {
		gas = Number(process.env.CONTRACT_GAS);
	}

	try {
		const tx = new ContractCallQuery()
			.setContractId(contractId)
			.setFunctionParameters(
				encodeFunctionCall(
					funcName,
					abiPath,
					funcParams ? funcParams : []
				)
			)
			.setGas(gas);

		const response = await tx.execute(client);

		return response;
	} catch (err) {
		console.log(err);
		return null;
	}
}

/**
 * Creates a new Topic on Hedera
 * @param client - the Hedera client that will sign the Topic creation
 * @param operatorKey - the Hedera PrivateKey for the Hedera client used to sign the Topic creation
 * @returns topicId - the Hedera TopicId for the created topic
 */
export async function createTopic(
	client: Client,
	operatorKey: PrivateKey
): Promise<TopicId> {
	try {
		const successCode = 22; // A transaction receipt returns a status code of 22 if the transaction was a success

		const operatorId = client.operatorAccountId;
		const operatorPubKey = client.operatorPublicKey;
		if (!operatorId || !operatorPubKey) {
			throw new Error(
				"Client must have an AccountId and PublicKey attached"
			);
		}

		// Create topic
		const topicTransaction = await new TopicCreateTransaction()
			.setAdminKey(operatorPubKey)
			.freezeWith(client);

		topicTransaction.sign(operatorKey);
		const topicSubmit = await topicTransaction.execute(client);
		const topicReceipt = await topicSubmit.getReceipt(client);
		const topicId = topicReceipt.topicId;
		const topicStatus = topicReceipt.status._code;

		// Error if transaction failed
		if (topicStatus !== successCode || !topicId) {
			throw new Error(`❌The topic creation failed❌`);
		}
		const topicAddressSol = topicId.toSolidityAddress();

		console.log(
			`- The topicId is : ${topicId} \n- The topic address in solidity format is ${topicAddressSol}\n`
		);

		return topicId;
	} catch (err) {
		console.log(err);
		throw err;
	}
}

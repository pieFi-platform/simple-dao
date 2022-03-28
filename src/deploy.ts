console.clear();
import dotenv from "dotenv";
dotenv.config();
import {
	Client,
	ContractCreateTransaction,
	ContractId,
	FileCreateTransaction,
	FileAppendTransaction,
	Hbar,
	PrivateKey,
	TopicId,
} from "@hashgraph/sdk";
import fs from "fs";

import { callContractFunc, createTopic } from "./utils";

const DEPLOY_IMP_FUNC_NAME = "createImp";
const DEPLOY_PROXY_FUNC_NAME = "createProxy";

/**
 * Deploys a Factory contract on Hedera
 * @param client - the Hedera client that will sign the contract creation transactions and become
 *                 the owner on the Factory contract
 * @param binPath - the relative path for binary file of the Factory contract
 * @param operatorKey - the Hedera PrivateKey for the Hedera client used as the owner of the Factory contract
 * @returns factoryContractId - the Hedera ContractId for the deployed DaoFactory contract
 * @returns factoryContractAddress - the solidity address for the deployed Factory contract
 */
export async function deployFactory(
	client: Client,
	binPath: string,
	operatorKey: PrivateKey
): Promise<[ContractId, string]> {
	// Hedera specific variables
	const chunkSize = 1024; // Max chunk size (Hedera uploads in chunks of 1kb)
	const successCode = 22; // A transaction receipt returns a status code of 22 if the transaction was a success

	try {
		// Get bin path from .env
		const contractBytecode = fs.readFileSync(binPath);

		// Determine size of bin file and chunks
		const contractBytecodeSizeB = fs.statSync(binPath).size;
		const maxChunks = Math.ceil(contractBytecodeSizeB / chunkSize) + 1;
		console.log("Contract size is: ", contractBytecodeSizeB);
		console.log("Number of chunks is: ", maxChunks, `\n`);

		//////////////////Create empty file transaction//////////////////
		console.log(`⏱ Creating file...`);
		const fileCreateTx = new FileCreateTransaction().setKeys([operatorKey]);

		// Add any additional methods
		if (process.env.FILE_MEMO) {
			fileCreateTx.setFileMemo(process.env.FILE_MEMO);
			console.log(`-Added file memo-`);
		}
		if (process.env.EXPIRATION_DAYS) {
			const expirationDays =
				parseInt(process.env.EXPIRATION_DAYS) * 24 * 60 * 60 * 1000; // Caclulating expiration days in milliseconds
			fileCreateTx.setExpirationTime(
				new Date(Date.now() + expirationDays)
			); //ERROR - working with ~90 days, but returning AUTORENEW_DURATION_NOT_IN_RANGE otherwise (functionality not fully built out)
			console.log(`-Added expiration date- \n`);
		}
		// Freeze and sign
		fileCreateTx.freezeWith(client);
		fileCreateTx.sign(operatorKey);

		const fileCreateSubmit = await fileCreateTx.execute(client);
		const fileCreateRx = await fileCreateSubmit.getReceipt(client);
		const fileCreateStatus = fileCreateRx.status._code;
		const bytecodeFileId = fileCreateRx.fileId;

		// Error if transaction failed
		if (fileCreateStatus !== successCode || !bytecodeFileId) {
			throw new Error(`❌The file creation transaction failed❌`);
		}

		// Log bytecode file ID
		console.log(`✅The bytecode file ID is: ${bytecodeFileId} \n`);

		//////////////////Append contents to the file//////////////////
		console.log(`⏱ Appending to file...`);
		const fileAppendTx = new FileAppendTransaction()
			.setFileId(bytecodeFileId)
			.setContents(contractBytecode)
			.setMaxChunks(maxChunks)
			.freezeWith(client);

		// Sign transaction
		fileAppendTx.sign(operatorKey);
		const fileAppendSubmit = await fileAppendTx.execute(client);
		const fileAppendRx = await fileAppendSubmit.getReceipt(client);
		const fileAppendStatus = fileAppendRx.status._code;

		// Error if transaction failed
		if (fileAppendStatus !== successCode) {
			throw new Error(`❌The file append transaction failed❌`);
		}

		// Log file append transaction status
		console.log(`✅The file append was a : ${fileAppendRx.status} 👍 \n`);

		//////////////////Instantiate smart contract//////////////////
		console.log(`⏱ Creating Factory contract...`);
		let gas: number = 1000000;
		if (process.env.CONTRACT_GAS) {
			gas = parseInt(process.env.CONTRACT_GAS);
		}

		const contractInstantiateTx = new ContractCreateTransaction()
			.setBytecodeFileId(bytecodeFileId)
			.setGas(gas);

		if (process.env.INITIAL_HBAR_BALANCE) {
			const hbarBalance = parseInt(process.env.INITIAL_HBAR_BALANCE);
			contractInstantiateTx.setInitialBalance(new Hbar(hbarBalance));
			console.log(`-Set initial Hbar balance-`);
		}
		if (process.env.PROXY_ACCOUNT_ID) {
			contractInstantiateTx.setProxyAccountId(
				process.env.PROXY_ACCOUNT_ID
			);
			console.log(`-Set proxy account id-`);
		}
		if (process.env.CONTRACT_MEMO) {
			contractInstantiateTx.setContractMemo(process.env.CONTRACT_MEMO);
			console.log(`-Set contract memo-`);
		}
		if (process.env.ADMIN_KEY) {
			const adminKey = PrivateKey.fromString(process.env.ADMIN_KEY);
			contractInstantiateTx.setAdminKey(adminKey);
			contractInstantiateTx.freezeWith(client);
			contractInstantiateTx.sign(adminKey);
			console.log(`-Set admin key- \n`);
		}

		const contractInstantiateSubmit = await contractInstantiateTx.execute(
			client
		);
		const contractInstantiateRx =
			await contractInstantiateSubmit.getReceipt(client);
		const contractInstantiateStatus = contractInstantiateRx.status._code;
		const factoryContractId = contractInstantiateRx.contractId;

		// Error if transaction failed
		if (contractInstantiateStatus !== successCode || !factoryContractId) {
			throw new Error(`❌The file append transaction failed❌`);
		}
		const factoryContractAddress = factoryContractId.toSolidityAddress();

		// Log contract Id and Solidity address for contract
		console.log(`✅The Factory contract ID is: ${factoryContractId}`);
		console.log(
			`✅The Factory contract Solidity address is: ${factoryContractAddress} \n`
		);

		return [factoryContractId, factoryContractAddress];
	} catch (err) {
		console.log(err);
		throw err;
	}
}

/**
 * Deploys the Implementation contract connected to the DaoFactory contract on Hedera
 * @param factoryId - the Hedera ContractId for the deployed DaoFactory contract
 * @param factoryAbi - the relative path for abi file of the Factory contract
 * @param client - the Hedera client that will sign the contract creation transactions and become
 *                 the owner on the Dao (implementation) contract
 * @param operatorKey - the Hedera PrivateKey for the Hedera client used as the owner of the
 *                      Dao (implementation) contract
 * @returns impAddress - the solidity address for the deployed Dao (implementation) contract
 * @returns daoTopicId - the Hedera TopicId for the topic stored on the deployed Dao
 *                       (implementation) contract
 */
export async function deployImp(
	factoryId: ContractId,
	factoryAbi: string,
	client: Client,
	operatorKey: PrivateKey
): Promise<[string, TopicId]> {
	const daoInput: DaoInput = {
		daoName: "Implementation",
	};

	const daoTopicId = await createTopic(client, operatorKey);

	const funcParams = [
		daoInput.daoName,
		`0x${daoTopicId.toSolidityAddress()}`,
	];

	console.log(`⏱ Creating Implementation contract...`);
	const response = await callContractFunc(
		factoryId,
		factoryAbi,
		DEPLOY_IMP_FUNC_NAME,
		funcParams,
		client
	);

	if (!response) {
		throw new Error("Failed to deploy Implementation Contract");
	}
	const impAddress = response.getAddress();
	const impId = `0.0.${parseInt(impAddress, 16)}`; //Convert hex to dec to get the ContractId
	console.log(`✅The Implementation contract ID is: ${impId}`);
	console.log(
		`✅The Implementation contract Solidity address is: ${impAddress} \n`
	);

	return [impAddress, daoTopicId];
}

/**
 * Deploys a Proxy contract connected to the DaoFactory contract on Hedera
 * @param factoryId - the Hedera ContractId for the deployed DaoFactory contract
 * @param factoryAbi - the relative path for abi file of the Factory contract
 * @param impAddress - the solidity address for the deployed Dao (implementation) contract connected
 *                     to the deployed Factory contract
 * @param client - the Hedera client that will sign the contract creation transactions and become
 *                 the owner on the DaoProxy contract
 * @param operatorKey - the Hedera PrivateKey for the Hedera client used as the owner of the
 *                      DaoProxy contract
 * @param daoInput - details for the dao that are passed as function parameters to create the dao (daoName)
 * @returns proxyAddress - the solidity address for the deployed DaoProxy contract
 * @returns daoTopicId - the Hedera TopicId for the topic stored on the deployed DaoProxy contract
 */
export async function deployProxy(
	factoryId: ContractId,
	factoryAbi: string,
	impAddress: string,
	client: Client,
	operatorKey: PrivateKey,
	daoInput: DaoInput
): Promise<[string, TopicId]> {
	const daoTopicId = await createTopic(client, operatorKey);

	const funcParams = [
		daoInput.daoName,
		`0x${daoTopicId.toSolidityAddress()}`,
		`0x${impAddress}`,
	];

	console.log(`⏱ Creating Proxy contract...`);
	const response = await callContractFunc(
		factoryId,
		factoryAbi,
		DEPLOY_PROXY_FUNC_NAME,
		funcParams,
		client
	);

	if (!response) {
		throw new Error("Failed to deploy Proxy Contract");
	}
	const proxyAddress = response.getAddress();
	const proxyId = `0.0.${parseInt(proxyAddress, 16)}`; //Convert hex to dec to get the ContractId
	console.log(`✅The Proxy contract ID is: ${proxyId}`);
	console.log(`✅The Proxy contract Solidity address is: ${proxyAddress} \n`);

	return [proxyAddress, daoTopicId];
}

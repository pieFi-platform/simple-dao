console.clear();
import dotenv from "dotenv";
dotenv.config();
import { AccountId, PrivateKey, ContractId, TopicId } from "@hashgraph/sdk";
import { deployFactory, deployImp, deployProxy } from "./deploy";
import { callContractFunc, queryContractFunc, getClient } from "./utils";

/**
 * Creates and deploys the Dao Factory, Implementation, and Proxy contracts
 * @param operatorId - the AccountId for the owner of the Dao contract
 * @param operatorKey - the PrivateKey for the owner of the Dao contract
 * @param network - the network that the contract should be deployed on: either Testnet or Mainnet
 * @param factoryBin - the relative path for binary file of the Factory contract
 * @param factoryAbi - the relative path for abi file of the Factory contract
 * @param daoName - the name of the Dao that is being created. The dao name must be 32 characters
 *                  or less.
 * @returns factoryContractId - the Hedera ContractId for the deployed DaoFactory contract
 * @returns implementationContractAddress - the solidity address for the deployed Dao
 *          (implementation) contract
 * @returns proxyContractAddress - the solidity address for the deployed DaoProxy contract
 * @returns impTopicId - the Hedera TopicId for the topic stored on the deployed Dao
 *          (implementation) contract
 * @returns proxyTopicId - the Hedera TopicId for the topic stored on the DaoProxy contract
 */
export async function createDao(
	operatorId: AccountId,
	operatorKey: PrivateKey,
	network: string,
	factoryBin: string,
	factoryAbi: string,
	daoName: string
): Promise<[ContractId, string, string, TopicId, TopicId]> {
	try {
		const MAX_STRING_SIZE = 32; // The max string size for the dao's name is 32 bytes
		const daoInput = {
			daoName: daoName,
		};

		const nameSize = Buffer.from(daoName).length;

		if (nameSize > MAX_STRING_SIZE) {
			throw new Error("❌The Dao name must be 32 characters or less❌");
		}

		const client = getClient(operatorId, operatorKey, network);

		let factoryContractId;
		if (process.env.FACTORY_ID && process.env.FACTORY_ADDRESS) {
			factoryContractId = ContractId.fromString(process.env.FACTORY_ID);
			// factoryContractAddress = process.env.FACTORY_ADDRESS;
		} else {
			[factoryContractId] = await deployFactory(
				client,
				factoryBin,
				operatorKey
			);
		}

		const [implementationContractAddress, impTopicId] = await deployImp(
			factoryContractId,
			factoryAbi,
			client,
			operatorKey
		);

		const [proxyContractAddress, proxyTopicId] = await deployProxy(
			factoryContractId,
			factoryAbi,
			implementationContractAddress,
			client,
			operatorKey,
			daoInput
		);
		return [
			factoryContractId,
			implementationContractAddress,
			proxyContractAddress,
			impTopicId,
			proxyTopicId,
		];
	} catch (err) {
		console.log(err);
		throw err;
	}
}

/**
 * Grants Dao access to a list of Hedera accounts
 *        Grant Access:
 *        Officers - Officers, Admins and Members
 *        Admins - Members
 *        Members - None
 * @param contractId - the Hedera ContractId for the deployed DaoProxy contract
 * @param contractAbi - the relative path for abi file of the DaoProxy contract
 * @param grantorId - the AccountId for the Dao user granting access
 * @param grantorKey - the PrivateKey for the Dao user granting access
 * @param network - the network that the contract is deployed on: either Testnet or Mainnet
 * @param userIds - array of Hedera AccountIds for the Accounts to be added as users of the Dao
 * @param accessType - the AccessType enum type of access to be granted
 */
export async function grantAccess(
	contractId: ContractId,
	contractAbi: string,
	grantorId: AccountId,
	grantorKey: PrivateKey,
	network: string,
	userIds: AccountId[],
	accessType: AccessType
) {
	try {
		const client = getClient(grantorId, grantorKey, network);
		const functionName = `addUser`;

		//Add access
		const functionParams = userIds.map((account: AccountId) => {
			return `0x${account.toSolidityAddress()}`;
		});
		functionParams.push(accessType.toString());
		console.log(`\n⏱ Granting access...`);
		const response = await callContractFunc(
			contractId,
			contractAbi,
			functionName,
			functionParams,
			client
		);

		console.log(`RESPONSE: ${response}`);
		if (!response) {
			throw new Error("❌Grant Access Failed❌");
		}
	} catch (err) {
		console.log(err);
	}
}

/**
 * Removes Dao access for a list of Hedera accounts
 *        Removal Access:
 *        Officers - Admins and Members
 *        Admins - Members
 *        Members - None
 * @param contractId - the Hedera ContractId for the deployed DaoProxy contract
 * @param contractAbi - the relative path for abi file of the DaoProxy contract
 * @param removorId - the AccountId for the Dao user removing access
 * @param removorKey - the PrivateKey for the Dao user removing access
 * @param network - the network that the contract is deployed on: either Testnet or Mainnet
 * @param userIds - array of Hedera AccountIds for the Accounts to be removed from the Dao
 */
export async function removeAccess(
	contractId: ContractId,
	contractAbi: string,
	removorId: AccountId,
	removorKey: PrivateKey,
	network: string,
	userIds: AccountId[]
) {
	try {
		const client = getClient(removorId, removorKey, network);
		const functionName = `removeUser`;

		//Remove access
		const functionParams = userIds.map((account: AccountId) => {
			return `0x${account.toSolidityAddress()}`;
		});
		console.log(`\n⏱ Removing access...`);
		await callContractFunc(
			contractId,
			contractAbi,
			functionName,
			functionParams,
			client
		);
	} catch (err) {
		console.log(err);
	}
}

/**
 * Removes an Officer from a Dao
 *        Removal Access:
 *        Owner - Officer
 * @param contractId - the Hedera ContractId for the deployed DaoProxy contract
 * @param contractAbi - the relative path for abi file of the DaoProxy contract
 * @param ownerId - the AccountId for the Dao user removing access
 * @param ownerKey - the PrivateKey for the Dao user removing access
 * @param network - the network that the contract is deployed on: either Testnet or Mainnet
 * @param officerId - AccountId for the officer being removed
 */
export async function removeOfficer(
	contractId: ContractId,
	contractAbi: string,
	ownerId: AccountId,
	ownerKey: PrivateKey,
	network: string,
	officerId: AccountId
) {
	try {
		const client = getClient(ownerId, ownerKey, network);
		const functionName = `removeOfficer`;

		//Remove access
		const functionParams = [`0x${officerId.toSolidityAddress()}`];
		console.log(`\n⏱ Removing access...`);
		await callContractFunc(
			contractId,
			contractAbi,
			functionName,
			functionParams,
			client
		);
	} catch (err) {
		console.log(err);
	}
}

/**
 * Updates the max users allowed in the Dao
 *        Update Access:
 *        Owner
 * @param contractId - the Hedera ContractId for the deployed DaoProxy contract
 * @param contractAbi - the relative path for abi file of the DaoProxy contract
 * @param ownerId - the AccountId for the Dao user removing access
 * @param ownerKey - the PrivateKey for the Dao user removing access
 * @param network - the network that the contract is deployed on: either Testnet or Mainnet
 * @param maxUserAmount - New maximum user amount
 */
export async function setMaxUsers(
	contractId: ContractId,
	contractAbi: string,
	ownerId: AccountId,
	ownerKey: PrivateKey,
	network: string,
	maxUserAmount: number
) {
	try {
		const client = getClient(ownerId, ownerKey, network);
		const functionName = `setMaxUsers`;

		//Remove access
		const functionParams = [maxUserAmount.toString()];
		console.log(`\n⏱ Removing access...`);
		await callContractFunc(
			contractId,
			contractAbi,
			functionName,
			functionParams,
			client
		);
	} catch (err) {
		console.log(err);
	}
}

/**
 * Queries the Dao for a given user and returns the user's access to the Dao
 * @param contractId - the Hedera ContractId for the deployed DaoProxy contract
 * @param contractAbi - the relative path for abi file of the DaoProxy contract
 * @param operatorId - the AccountId for the client preforming the query
 * @param operatorKey - the PrivateKey for the client preforming the query
 * @param network - the network that the contract is deployed on: either Testnet or Mainnet
 * @param userId - AccountId for the user whose access is being queried
 */
export async function getUserAccess(
	contractId: ContractId,
	contractAbi: string,
	operatorId: AccountId,
	operatorKey: PrivateKey,
	network: string,
	userId: AccountId
) {
	try {
		const client = getClient(operatorId, operatorKey, network);
		const functionName = `getUser`;

		//Query contract
		const functionParams = [`0x${userId.toSolidityAddress()}`];
		console.log(`\n⏱ Querying User Access...`);
		await queryContractFunc(
			contractId,
			contractAbi,
			functionName,
			functionParams,
			client
		);
	} catch (err) {
		console.log(err);
	}
}

///////////For Testing//////////////
export async function checkBalances(
	contractId: ContractId,
	contractAbi: string
) {
	const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
	const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
	const aliceId = AccountId.fromString(process.env.TRANSFER_TEST_ID);
	const bobId = AccountId.fromString(process.env.BOB_ID);
	const sallyId = AccountId.fromString(process.env.SALLY_ID);
	const network = process.env.NETWORK;

	const operatorAccess = await getUserAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		operatorId
	);
	console.log(`Operator's access type is: ${operatorAccess}`);
	const aliceAccess = await getUserAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		aliceId
	);
	console.log(`Alice's access type is: ${aliceAccess}`);
	const bobAccess = await getUserAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		bobId
	);
	console.log(`Bob's access type is: ${bobAccess}`);
	const sallyAccess = await getUserAccess(
		contractId,
		contractAbi,
		operatorId,
		operatorKey,
		network,
		sallyId
	);
	console.log(`Sally's access type is: ${sallyAccess}`);
}

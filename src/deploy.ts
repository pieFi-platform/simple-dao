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
  TokenId,
} from "@hashgraph/sdk";
import fs from "fs";

import { callContractFunc, makeTokens, updateTokenSupplyKey } from "./utils";

const DEPLOY_IMP_FUNC_NAME = "createImp";
const DEPLOY_PROXY_FUNC_NAME = "createProxy";

export async function deployFactory(
  client: Client,
  binPath: string,
  operatorKey: PrivateKey
): Promise<[factoryContractId: ContractId, factoryContractAddress: string]> {
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
      fileCreateTx.setExpirationTime(new Date(Date.now() + expirationDays)); //ERROR - working with ~90 days, but returning AUTORENEW_DURATION_NOT_IN_RANGE otherwise (functionality not fully built out)
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
    console.log(`⏱ Creating smart contract...`);
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
      contractInstantiateTx.setProxyAccountId(process.env.PROXY_ACCOUNT_ID);
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
    const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(
      client
    );
    const contractInstantiateStatus = contractInstantiateRx.status._code;
    const factoryContractId = contractInstantiateRx.contractId;

    // Error if transaction failed
    if (contractInstantiateStatus !== successCode || !factoryContractId) {
      throw new Error(`❌The file append transaction failed❌`);
    }
    const factoryContractAddress = factoryContractId.toSolidityAddress();

    // Log contract Id and Solidity address for contract
    console.log(`✅The smart contract ID is: ${factoryContractId}`);
    console.log(
      `✅The smart contract Solidity address is: ${factoryContractAddress} \n`
    );

    return [factoryContractId, factoryContractAddress];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function deployImp(
  factoryId: ContractId,
  factoryAbi: string,
  client: Client,
  treasuryKey: PrivateKey
): Promise<string> {
  const daoInput: DaoInput = {
    daoName: "Implementation",
    daoSymbol: "IMP",
    officerSupply: 50,
    adminSupply: 75,
    memberSupply: 100,
  };
  const funcParams = await makeTokens(treasuryKey, client, daoInput);

  const _funcParams = funcParams.map((token: TokenId) => {
    return `0x${token.toSolidityAddress()}`;
  });

  const response = await callContractFunc(
    factoryId,
    factoryAbi,
    DEPLOY_IMP_FUNC_NAME,
    _funcParams,
    client
  );

  if (!response) {
    throw new Error("Failed to deploy Implementation Contracat");
  }
  const impAddress = response.getAddress();

  // Update the supply keys
  for (const token of funcParams) {
    await updateTokenSupplyKey(
      token,
      ContractId.fromSolidityAddress(impAddress),
      client,
      treasuryKey
    );
  }

  return impAddress;
}

export async function deployProxy(
  factoryId: ContractId,
  factoryAbi: string,
  impAddress: string,
  client: Client,
  treasuryKey: PrivateKey,
  daoInput: DaoInput
): Promise<string> {
  const tokens = await makeTokens(treasuryKey, client, daoInput);

  const funcParams = tokens.map((token: TokenId) => {
    return `0x${token.toSolidityAddress()}`;
  });
  funcParams.push(`0x${impAddress}`);

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

  for (const token of tokens) {
    await updateTokenSupplyKey(
      token,
      ContractId.fromSolidityAddress(proxyAddress),
      client,
      treasuryKey
    );
  }

  return proxyAddress;
}

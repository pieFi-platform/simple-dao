console.clear();
import dotenv from "dotenv";
dotenv.config();
import {
  AccountId,
  PrivateKey,
  Client,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  Hbar,
  TokenId,
} from "@hashgraph/sdk";
import fs from "fs";

export async function deployContract(
  operatorId: AccountId,
  operatorKey: PrivateKey,
  officerTokenId: TokenId,
  adminTokenId: TokenId,
  memberTokenId: TokenId
) {
  // Hedera specific variables
  const chunkSize = 1024; // Max chunk size (Hedera uploads in chunks of 1kb)
  const successCode = 22; // A transaction receipt returns a status code of 22 if the transaction was a success

  const signKeys = [operatorKey];
  try {
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    // Get bin path from .env
    const contractBytecode = fs.readFileSync(process.env.BIN);

    // Determine size of bin file and chunks
    const contractBytecodeSizeB = fs.statSync(process.env.BIN).size;
    const maxChunks = Math.ceil(contractBytecodeSizeB / chunkSize) + 1;
    console.log("Contract size is: ", contractBytecodeSizeB);
    console.log("Number of chunks is: ", maxChunks, `\n`);

    //////////////////Create empty file transaction//////////////////
    console.log(`⏱ Creating file...`);
    const fileCreateTx = new FileCreateTransaction().setKeys(signKeys);

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
    for (const key of signKeys) {
      fileCreateTx.sign(key);
    }

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
    for (const key of signKeys) {
      fileAppendTx.sign(key);
    }
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

    const funcParams = new ContractFunctionParameters()
      .addAddress(officerTokenId.toSolidityAddress())
      .addAddress(adminTokenId.toSolidityAddress())
      .addAddress(memberTokenId.toSolidityAddress());
    if (process.env.PROXY) {
      console.log("Adding contract address to func params");
      funcParams.addAddress(process.env.MAIN_CONTRACT_ADDRESS);
    }

    const contractInstantiateTx = new ContractCreateTransaction()
      .setBytecodeFileId(bytecodeFileId)
      .setGas(parseInt(process.env.CONTRACT_GAS))
      .setConstructorParameters(funcParams);

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
    const contractId = contractInstantiateRx.contractId;

    // Error if transaction failed
    if (contractInstantiateStatus !== successCode || !contractId) {
      throw new Error(`❌The file append transaction failed❌`);
    }
    const contractAddress = contractId.toSolidityAddress();

    // Log contract Id and Solidity address for contract
    console.log(`✅The smart contract ID is: ${contractId}`);
    console.log(
      `✅The smart contract Solidity address is: ${contractAddress} \n`
    );

    return contractId;
  } catch (err) {
    console.log(err);
    return;
  }
}

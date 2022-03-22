import {
  AccountId,
  Client,
  ContractExecuteTransaction,
  ContractFunctionResult,
  ContractId,
  TokenCreateTransaction,
  TokenId,
  TokenInfoQuery,
  TokenUpdateTransaction,
  PrivateKey,
} from "@hashgraph/sdk";
import * as fs from "fs";
import Web3 from "web3";

const web3 = new Web3();

// if (!process.env.ABI) {
//   throw new Error("Need ABI in env file");
// }
//const abiPath = process.env.ABI;
//const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
// console.log(abi);

/**
 * Decodes the result of a contract's function execution
 * @param functionName the name of the function within the ABI
 * @param resultAsBytes a byte array containing the execution result
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
 * @param parameters the array of parameters to pass to the function
 */
export function encodeFunctionCall(
  functionName: string,
  abiPath: string,
  parameters: string[]
) {
  const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

  const functionAbi = abi.find(
    (func: any) => func.name === functionName && func.type === "function"
  );
  const encodedParametersHex = web3.eth.abi
    .encodeFunctionCall(functionAbi, parameters)
    .slice(2);
  return Buffer.from(encodedParametersHex, "hex");
}

export function getClient(
  operatorId: AccountId | null = null,
  operatorKey: PrivateKey | null = null,
  network: string | null = null
): Client {
  // Retrieve account info from .env
  if (!operatorId && process.env.OPERATOR_ID) {
    operatorId = AccountId.fromString(process.env.OPERATOR_ID.replace('"', ""));
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

export async function callContractFunc(
  contractId: ContractId,
  abiPath: string,
  funcName: string,
  funcParams: string[],
  client: Client,
  keys: PrivateKey[] | null = null
): Promise<ContractFunctionResult | null> {
  let gas = 1000000;
  if (process.env.CONTRACT_GAS) {
    gas = Number(process.env.CONTRACT_GAS);
  }

  console.log(`Using contractId: ${contractId}`);
  console.log(`Using funcName: ${funcName}`);
  console.log(`Using params: ${funcParams}`);
  console.log(`Using gas: ${gas}`);

  try {
    const tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setFunctionParameters(
        encodeFunctionCall(funcName, abiPath, funcParams ? funcParams : [])
      )
      .setGas(gas)
      .freezeWith(client);

    //    await tx.signWithOperator(client);

    if (keys) {
      for (const key of keys) {
        await tx.sign(key);
        console.log("Sign successful");
      }
    }

    const response = await tx.execute(client);

    const record = await response.getRecord(client);
    console.log(record);

    if (record.contractFunctionResult) {
      console.log(
        decodeFunctionResult(
          funcName,
          abiPath,
          record.contractFunctionResult.bytes
        )
      );
    }
    const txStatus = record.receipt.status;
    console.log(`The transaction status was: ${txStatus}`);
    return record.contractFunctionResult;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function makeTokens(
  treasuryKey: PrivateKey,
  client: Client,
  daoInput: DaoInput
): Promise<TokenId[]> {
  const tokens: TokenId[] = [];
  tokens.push(
    await createToken(
      treasuryKey,
      client,
      daoInput.daoName,
      daoInput.daoSymbol,
      daoInput.officerSupply,
      "officer"
    )
  );
  tokens.push(
    await createToken(
      treasuryKey,
      client,
      daoInput.daoName,
      daoInput.daoSymbol,
      daoInput.adminSupply,
      "admin"
    )
  );
  tokens.push(
    await createToken(
      treasuryKey,
      client,
      daoInput.daoName,
      daoInput.daoSymbol,
      daoInput.memberSupply,
      "member"
    )
  );

  return tokens;
}

async function createToken(
  _treasuryKey: PrivateKey,
  _client: Client,
  _dao_name: string,
  _dao_symbol: string,
  _numTokens: number,
  _tokenType: "officer" | "admin" | "member"
): Promise<TokenId> {
  try {
    const successCode = 22; // A transaction receipt returns a status code of 22 if the transaction was a success
    const tokenType = _tokenType.toLowerCase();
    const tokenName = `${_dao_name} - ${
      tokenType.charAt(0).toUpperCase() + tokenType.slice(1)
    }`;
    const tokenSymbol = `${_dao_symbol}-${tokenType.charAt(0).toUpperCase()}`;

    const operatorId = _client.operatorAccountId;
    const operatorKey = _client.operatorPublicKey;
    if (operatorId === null || operatorKey === null) {
      throw new Error("Client must have an AccountId and PublicKey attached");
    }

    // Create token
    console.log(`⏱ Creating ${tokenType} token...`);
    const tokenTransaction = await new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setDecimals(0)
      .setInitialSupply(_numTokens)
      .setTreasuryAccountId(operatorId) //TODO: Figure out how to get ID and Account from the client
      .setAdminKey(operatorKey)
      .setSupplyKey(operatorKey)
      .setFreezeKey(operatorKey)
      .freezeWith(_client)
      .sign(_treasuryKey);
    const tokenSubmit = await tokenTransaction.execute(_client);
    const tokenReceipt = await tokenSubmit.getReceipt(_client);
    const tokenId = tokenReceipt.tokenId;
    const tokenStatus = tokenReceipt.status._code;

    // Error if transaction failed
    if (tokenStatus !== successCode || !tokenId) {
      throw new Error(`❌The ${tokenType} token creation failed❌`);
    }
    const tokenAddressSol = tokenId.toSolidityAddress();

    console.log(
      `✅ The ${tokenName} token Id is : ${tokenId} \n✅ The ${tokenName} token in solidity format is ${tokenAddressSol}`
    );

    // Token Query - Check initial supply amount
    const tokenQuery = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .execute(_client);
    console.log(
      `-The initial token supply of ${tokenQuery.name} (${tokenQuery.symbol}) is ${tokenQuery.totalSupply.low}-\n`
    );

    return tokenId;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

////////////////////////Updates Token Supply Keys (called by createDao)////////////////////////
export async function updateTokenSupplyKey(
  tokenId: TokenId,
  contractId: ContractId,
  client: Client,
  treasuryKey: PrivateKey
) {
  // Update token so the smart contract manages the supply
  const tokenUpdateTx = new TokenUpdateTransaction()
    .setTokenId(tokenId)
    .setSupplyKey(contractId)
    .freezeWith(client);
  const tokenUpdateSign = await tokenUpdateTx.sign(treasuryKey);
  const tokenUpdateSubmit = await tokenUpdateSign.execute(client);
  const tokenUpdateReceipt = await tokenUpdateSubmit.getReceipt(client);
  console.log(
    `-The supply key update for token ${tokenId} was a: ${tokenUpdateReceipt.status}-`
  );
}

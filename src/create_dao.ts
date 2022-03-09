console.clear();
import dotenv from "dotenv";
dotenv.config();
import {
  AccountId,
  PrivateKey,
  Client,
  ContractId,
  TokenId,
  AccountBalanceQuery,
  TokenFreezeTransaction,
  TokenUnfreezeTransaction,
} from "@hashgraph/sdk";
import { deployFactory, deployImp, deployProxy } from "./deploy";
import { callContractFunc, getClient } from "./utils";

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////Creates and Deploys Dao Contract/////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function createDao(
  _treasuryId: AccountId,
  _treasuryKey: PrivateKey,
  _network: string,
  _factoryBin: string,
  _factoryAbi: string,
  _daoName: string,
  _daoSymbol: string,
  _numOfficers: number,
  _numAdmins: number,
  _numMembers: number
): Promise<[ContractId, string, string, TokenId[], TokenId[]]> {
  try {
    const daoInput = {
      daoName: _daoName,
      daoSymbol: _daoSymbol,
      officerSupply: _numOfficers,
      adminSupply: _numAdmins,
      memberSupply: _numMembers,
    };
    const client = getClient(_treasuryId, _treasuryKey, _network);

    let factoryContractId, factoryContractAddress;
    if (process.env.FACTORY_ID && process.env.FACTORY_ADDRESS) {
      factoryContractId = ContractId.fromString(process.env.FACTORY_ID);
      factoryContractAddress = process.env.FACTORY_ADDRESS;
    } else {
      [factoryContractId, factoryContractAddress] = await deployFactory(
        client,
        _factoryBin,
        _treasuryKey
      );
    }

    const [implementationContractAddress, impTokens] = await deployImp(
      factoryContractId,
      _factoryAbi,
      client,
      _treasuryKey
    );

    const [proxyContractAddress, proxyTokens] = await deployProxy(
      factoryContractId,
      _factoryAbi,
      implementationContractAddress,
      client,
      _treasuryKey,
      daoInput
    );
    return [
      factoryContractId,
      implementationContractAddress,
      proxyContractAddress,
      impTokens,
      proxyTokens,
    ];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////Grants access to an account through the Dao smart contract////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function grantAccess(
  contractId: ContractId,
  contractAbi: string,
  network: string,
  granteeId: AccountId,
  granteeKey: PrivateKey,
  grantorId: AccountId,
  grantorKey: PrivateKey,
  treasuryKey: PrivateKey,
  accessType: "officer" | "admin" | "member",
  tokenId: TokenId
) {
  const successCode = 22; // A transaction receipt returns a status code of 22 if the transaction was a success
  try {
    const tokenType = `${
      accessType.charAt(0).toUpperCase() + accessType.slice(1)
    }`;
    const functionName = `add${tokenType}`;
    const client = getClient(grantorId, grantorKey, network);

    //Add access
    const functionParams = [`0x${granteeId.toSolidityAddress()}`];
    const keys = [granteeKey, treasuryKey];
    console.log(`\n⏱ Granting access...`);
    const response = await callContractFunc(
      contractId,
      contractAbi,
      functionName,
      functionParams,
      client,
      keys
    );

    console.log(`RESPONSE: ${response}`);
    if (!response) {
      throw new Error("callContractFun failed!");
    }

    //Freeze Account
    const freezeTx = await new TokenFreezeTransaction()
      .setAccountId(granteeId)
      .setTokenId(tokenId)
      .freezeWith(client);
    const freezeSign = await freezeTx.sign(treasuryKey);
    const freezeSubmit = await freezeSign.execute(client);
    const freezeReceipt = await freezeSubmit.getReceipt(client);
    const freezeStatus = freezeReceipt.status._code;

    // Error if transaction failed
    if (freezeStatus !== successCode) {
      throw new Error(`❌The account freeze transaction failed❌`);
    } else {
      console.log(`-The account freeze was a success!-`);
    }
  } catch (err) {
    console.log(err);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////Removes access to an account through the Dao smart contract///////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function removeAccess(
  contractId: ContractId,
  contractAbi: string,
  network: string,
  removeeId: AccountId,
  removeeKey: PrivateKey,
  removorId: AccountId,
  removorKey: PrivateKey,
  treasuryKey: PrivateKey,
  accessType: "admin" | "member",
  tokenId: TokenId
) {
  const successCode = 22; // A transaction receipt returns a status code of 22 if the transaction was a success
  try {
    const tokenType = `${
      accessType.charAt(0).toUpperCase() + accessType.slice(1)
    }`;
    const functionName = `remove${tokenType}`;
    const client = getClient(removorId, removorKey, network);

    //Unfreeze Account
    console.log(`\n⏱ Removing access...`);
    const unfreezeTx = await new TokenUnfreezeTransaction()
      .setAccountId(removeeId)
      .setTokenId(tokenId)
      .freezeWith(client);
    const unfreezeSign = await unfreezeTx.sign(treasuryKey);
    const unfreezeSubmit = await unfreezeSign.execute(client);
    const unfreezeReceipt = await unfreezeSubmit.getReceipt(client);
    const unfreezeStatus = unfreezeReceipt.status._code;

    // Error if transaction failed
    if (unfreezeStatus !== successCode) {
      throw new Error(`❌The account unfreeze transaction failed❌`);
    } else {
      console.log(`-The account unfreeze was a success!-`);
    }

    //Remove access
    const functionParams = [`0x${removeeId.toSolidityAddress()}`];
    const keys = [removeeKey, treasuryKey];
    console.log(`\n⏱ Removing access...`);
    await callContractFunc(
      contractId,
      contractAbi,
      functionName,
      functionParams,
      client,
      keys
    ); //We may need to pass in the removeeKey to sign the transaction (for dissociating) and _treasuryKey
  } catch (err) {
    console.log(err);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////Mints tokens using the Dao smart contract////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function mintTokens(
  contractId: ContractId,
  contractAbi: string,
  network: string,
  _tokenType: "officer" | "admin" | "member",
  amount: number,
  treasuryId: AccountId,
  treasuryKey: PrivateKey
) {
  const client = getClient(treasuryId, treasuryKey, network);
  const tokenType = `${
    _tokenType.charAt(0).toUpperCase() + _tokenType.slice(1)
  }`;
  const functionName = `mint${tokenType}Tokens`;

  //Mint tokens
  const functionParams = [amount.toString()];
  console.log(`\n⏱ Minting Tokens...`);
  await callContractFunc(
    contractId,
    contractAbi,
    functionName,
    functionParams,
    client
  );
}

function valOrZero(input: any): Number {
  return input ? input : 0;
}

///////////For Testing//////////////
export async function checkBalances(
  officerTokenId: TokenId,
  adminTokenId: TokenId,
  memberTokenId: TokenId
) {
  const treasuryId = AccountId.fromString(process.env.OPERATOR_ID);
  const treasuryKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
  const aliceId = AccountId.fromString(process.env.TRANSFER_TEST_ID);
  const bobId = AccountId.fromString(process.env.BOB_ID);
  const sallyId = AccountId.fromString(process.env.SALLY_ID);

  const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);

  const treasuryOffBalance = await checkBalance(treasuryId, officerTokenId);
  const treasuryAdBalance = await checkBalance(treasuryId, adminTokenId);
  const treasuryMemBalance = await checkBalance(treasuryId, memberTokenId);
  console.log(
    `Treasury has: ${valOrZero(treasuryOffBalance)} officer tokens, ${valOrZero(
      treasuryAdBalance
    )} admin tokens, and ${valOrZero(treasuryMemBalance)} member tokens`
  );

  const aliceOffBalance = await checkBalance(aliceId, officerTokenId);
  const aliceAdBalance = await checkBalance(aliceId, adminTokenId);
  const aliceMemBalance = await checkBalance(aliceId, memberTokenId);
  console.log(
    `Alice has: ${valOrZero(aliceOffBalance)} officer tokens, ${valOrZero(
      aliceAdBalance
    )} admin tokens, and ${valOrZero(aliceMemBalance)} member tokens`
  );

  const bobOffBalance = await checkBalance(bobId, officerTokenId);
  const bobAdBalance = await checkBalance(bobId, adminTokenId);
  const bobMemBalance = await checkBalance(bobId, memberTokenId);
  console.log(
    `Bob has: ${valOrZero(bobOffBalance)} officer tokens, ${valOrZero(
      bobAdBalance
    )} admin tokens, and ${valOrZero(bobMemBalance)} member tokens`
  );

  const sallyOffBalance = await checkBalance(sallyId, officerTokenId);
  const sallyAdBalance = await checkBalance(sallyId, adminTokenId);
  const sallyMemBalance = await checkBalance(sallyId, memberTokenId);
  console.log(
    `Sally has: ${valOrZero(sallyOffBalance)} officer tokens, ${valOrZero(
      sallyAdBalance
    )} admin tokens, and ${valOrZero(sallyMemBalance)} member tokens`
  );

  async function checkBalance(aId: AccountId, tId: TokenId) {
    try {
      let balanceCheckTx = await new AccountBalanceQuery()
        .setAccountId(aId)
        .execute(client);
      if (!balanceCheckTx.tokens) {
        throw new Error(`❌Balance Check failed❌`);
      }
      return balanceCheckTx.tokens._map.get(tId.toString());
    } catch (err) {
      console.log(err);
      return;
    }
  }
}

// const treasuryId = AccountId.fromString(process.env.OPERATOR_ID);
// const treasuryKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
// const aliceId = AccountId.fromString(process.env.TRANSFER_TEST_ID);
// const aliceKey = PrivateKey.fromString(process.env.TRANSFER_TEST_PVKEY);
// const bobId = AccountId.fromString(process.env.BOB_ID);
// const bobKey = PrivateKey.fromString(process.env.BOB_PVKEY);
// const sallyId = AccountId.fromString(process.env.SALLY_ID);
// const sallyKey = PrivateKey.fromString(process.env.SALLY_PVKEY);

// const dao = createDao(
//   treasuryId.toString(),
//   treasuryKey.toString(),
//   "Factory",
//   "F",
//   12,
//   30,
//   110
// );

// const officerTokenId = TokenId.fromString(process.env.DAO_OFFICER_ID);
// const adminTokenId = TokenId.fromString(process.env.DAO_ADMIN_ID);
// const memberTokenId = TokenId.fromString(process.env.DAO_MEMBER_ID);
// const contractId = ContractId.fromString(process.env.CONTRACT_ID);
// const contractId = ContractId.fromString(process.env.PROXY_CONTRACT_ID);

// callContractFunc();
// checkBalances();

// grantAccess(
//   contractId,
//   aliceId,
//   aliceKey,
//   treasuryId,
//   treasuryKey,
//   treasuryKey,
//   "admin",
//   adminTokenId
// );

// grantAccess(
//   contractId,
//   sallyId,
//   sallyKey,
//   treasuryId,
//   treasuryKey,
//   treasuryKey,
//   "admin",
//   adminTokenId
// );

// removeAccess(
//   contractId,
//   sallyId,
//   sallyKey,
//   aliceId,
//   aliceKey,
//   treasuryKey,
//   "member",
//   memberTokenId
// );

// mintTokens(contractId, "member", 50, treasuryId, treasuryKey);

// grantAccess(
// 	contractId,
// 	sallyId,
// 	sallyKey,
// 	treasuryId,
// 	treasuryKey,
// 	treasuryKey,
// 	"officer",
// 	officerTokenId
// );

// async function sendHbar() {
//   const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);
//   const sendHbar = await new TransferTransaction()
//     .addHbarTransfer(treasuryId, Hbar.fromTinybars(-30000000))
//     .addHbarTransfer(aliceId, Hbar.fromTinybars(30000000))
//     .execute(client);
//   const sendreceipt = await sendHbar.getReceipt(client);
//   console.log(
//     "The transfer transaction from my account to the new account was: " +
//       sendreceipt.status.toString()
//   );

//   const query = await new AccountBalanceQuery()
//     .setAccountId(aliceId)
//     .execute(client);
//   console.log(
//     "The account balance after the transfer is: " +
//       query.hbars.toTinybars() +
//       " tinybar."
//   );
// }
// sendHbar();

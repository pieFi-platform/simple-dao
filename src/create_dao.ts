console.clear();
import dotenv from "dotenv";
dotenv.config();
import {
  AccountId,
  PrivateKey,
  Client,
  TokenCreateTransaction,
  TokenInfoQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  TokenId,
  AccountBalanceQuery,
  TokenFreezeTransaction,
  TokenUnfreezeTransaction,
  TokenUpdateTransaction,
  TransferTransaction,
  Hbar,
} from "@hashgraph/sdk";
import BigNumber from "bignumber.js";
import { deployContract } from "./deploy";

////////////////////////Create Tokens (called by createDao)////////////////////////
async function createToken(
  _treasuryId: AccountId,
  _treasuryKey: PrivateKey,
  _dao_name: string,
  _dao_symbol: string,
  _numTokens: number,
  _tokenType: "officer" | "admin" | "member"
) {
  const successCode = 22; // A transaction receipt returns a status code of 22 if the transaction was a success
  const client = Client.forTestnet().setOperator(_treasuryId, _treasuryKey);
  const tokenType = _tokenType.toLowerCase();
  const tokenName = `${_dao_name} - ${
    tokenType.charAt(0).toUpperCase() + tokenType.slice(1)
  }`;
  const tokenSymbol = `${_dao_symbol}-${tokenType.charAt(0).toUpperCase()}`;

  // Create token
  console.log(`⏱ Creating ${tokenType} token...`);
  const tokenTransaction = await new TokenCreateTransaction()
    .setTokenName(tokenName)
    .setTokenSymbol(tokenSymbol)
    .setDecimals(0)
    .setInitialSupply(_numTokens)
    .setTreasuryAccountId(_treasuryId)
    .setAdminKey(_treasuryKey)
    .setSupplyKey(_treasuryKey)
    .setFreezeKey(_treasuryKey)
    .freezeWith(client)
    .sign(_treasuryKey);
  const tokenSubmit = await tokenTransaction.execute(client);
  const tokenReceipt = await tokenSubmit.getReceipt(client);
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
    .execute(client);
  console.log(
    `-The initial token supply of ${tokenQuery.name} (${tokenQuery.symbol}) is ${tokenQuery.totalSupply.low}-\n`
  );

  return tokenId;
}

////////////////////////Updates Token Supply Keys (called by createDao)////////////////////////
async function updateTokenSupplyKey(
  tokenId: TokenId,
  contractId: ContractId,
  treasuryId: AccountId,
  treasuryKey: PrivateKey
) {
  // Update token so the smart contract manages the supply
  const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////Creates and Deploys Dao Contract/////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function createDao(
  _treasuryId: string,
  _treasuryKey: string,
  _daoName: string,
  _daoSymbol: string,
  _numOfficers: number,
  _numAdmins: number,
  _numMembers: number
): Promise<
  | {
      contractId: ContractId;
      officerTokenId: TokenId;
      adminTokenId: TokenId;
      memberTokenId: TokenId;
    }
  | undefined
> {
  try {
    // Configure client as treasury account
    const treasuryId = AccountId.fromString(_treasuryId);
    const treasuryKey = PrivateKey.fromString(_treasuryKey);
    // const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);

    // Create Tokens
    const officerTokenId = await createToken(
      treasuryId,
      treasuryKey,
      _daoName,
      _daoSymbol,
      _numOfficers,
      "officer"
    );
    const adminTokenId = await createToken(
      treasuryId,
      treasuryKey,
      _daoName,
      _daoSymbol,
      _numAdmins,
      "admin"
    );
    const memberTokenId = await createToken(
      treasuryId,
      treasuryKey,
      _daoName,
      _daoSymbol,
      _numMembers,
      "member"
    );

    // Deploy contract
    const contractId = await deployContract(
      treasuryId,
      treasuryKey,
      officerTokenId,
      adminTokenId,
      memberTokenId
    );

    // Error if transaction failed
    if (!contractId) {
      throw new Error(`❌The contract creation failed❌`);
    }
    console.log(
      `The contract was deployed and the contract ID is: ${contractId}`
    );

    //Update supply keys for tokens so smart contract has the ability to mint
    await updateTokenSupplyKey(
      adminTokenId,
      contractId,
      treasuryId,
      treasuryKey
    );
    await updateTokenSupplyKey(
      adminTokenId,
      contractId,
      treasuryId,
      treasuryKey
    );
    await updateTokenSupplyKey(
      memberTokenId,
      contractId,
      treasuryId,
      treasuryKey
    );

    return { contractId, officerTokenId, adminTokenId, memberTokenId };
  } catch (err) {
    console.log(err);
    return;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////Grants access to an account through the Dao smart contract////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function grantAccess(
  contractId: ContractId,
  granteeId: AccountId,
  granteeKey: PrivateKey,
  grantorId: AccountId,
  grantorKey: PrivateKey,
  _treasuryKey: PrivateKey,
  accessType: "officer" | "admin" | "member",
  tokenId: TokenId
) {
  const successCode = 22; // A transaction receipt returns a status code of 22 if the transaction was a success
  try {
    const tokenType = `${
      accessType.charAt(0).toUpperCase() + accessType.slice(1)
    }`;
    const functionType = `add${tokenType}`;
    const client = Client.forTestnet().setOperator(grantorId, grantorKey);

    //Add access
    console.log(`\n⏱ Granting access...`);
    const addAccessTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        functionType,
        new ContractFunctionParameters().addAddress(
          granteeId.toSolidityAddress()
        )
      )
      .freezeWith(client);
    const addAccessSignTreasury = await addAccessTx.sign(_treasuryKey);
    const addAccessSignGrantee = await addAccessSignTreasury.sign(granteeKey);
    const addAccessSubmit = await addAccessSignGrantee.execute(client);
    const addAccessReceipt = await addAccessSubmit.getReceipt(client);
    const addAccessStatus = addAccessReceipt.status._code;

    // Error if transaction failed
    if (addAccessStatus !== successCode) {
      throw new Error(`❌The grant access transaction failed❌`);
    } else {
      console.log(`-The access grant was a success!-`);
    }

    //Freeze Account
    const freezeTx = await new TokenFreezeTransaction()
      .setAccountId(granteeId)
      .setTokenId(tokenId)
      .freezeWith(client);
    const freezeSign = await freezeTx.sign(_treasuryKey);
    const freezeSubmit = await freezeSign.execute(client);
    const freezeReceipt = await freezeSubmit.getReceipt(client);
    const freezeStatus = freezeReceipt.status._code;

    // Error if transaction failed
    if (freezeStatus !== successCode) {
      throw new Error(`❌The account freeze transaction failed❌`);
    } else {
      console.log(`-The account freeze was a success!-`);
    }

    await checkBalances();
  } catch (err) {
    console.log(err);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////Removes access to an account through the Dao smart contract///////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function removeAccess(
  contractId: ContractId,
  removeeId: AccountId,
  removeeKey: PrivateKey,
  removorId: AccountId,
  removorKey: PrivateKey,
  _treasuryKey: PrivateKey,
  accessType: "admin" | "member",
  tokenId: TokenId
) {
  const successCode = 22; // A transaction receipt returns a status code of 22 if the transaction was a success
  try {
    const tokenType = `${
      accessType.charAt(0).toUpperCase() + accessType.slice(1)
    }`;
    const functionType = `remove${tokenType}`;
    const client = Client.forTestnet().setOperator(removorId, removorKey);

    //Unfreeze Account
    console.log(`\n⏱ Removing access...`);
    const unfreezeTx = await new TokenUnfreezeTransaction()
      .setAccountId(removeeId)
      .setTokenId(tokenId)
      .freezeWith(client);
    const unfreezeSign = await unfreezeTx.sign(_treasuryKey);
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
    const removeAccessTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction(
        functionType,
        new ContractFunctionParameters().addAddress(
          removeeId.toSolidityAddress()
        )
      )
      .freezeWith(client);
    const removeAccessSignTreasury = await removeAccessTx.sign(_treasuryKey);
    const removeAccessSignGrantee = await removeAccessSignTreasury.sign(
      removeeKey
    );
    const removeAccessSubmit = await removeAccessSignGrantee.execute(client);
    const removeAccessReceipt = await removeAccessSubmit.getReceipt(client);
    const removeAccessStatus = removeAccessReceipt.status._code;

    // Error if transaction failed
    if (removeAccessStatus !== successCode) {
      throw new Error(`❌The remove access transaction failed❌`);
    } else {
      console.log(`-The access removal was a success!-`);
    }

    await checkBalances();
  } catch (err) {
    console.log(err);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////Mints tokens using the Dao smart contract////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
async function mintTokens(
  contractId: ContractId,
  _tokenType: "officer" | "admin" | "member",
  amount: number,
  treasuryId: AccountId,
  treasuryKey: PrivateKey
) {
  const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);
  const tokenType = `${
    _tokenType.charAt(0).toUpperCase() + _tokenType.slice(1)
  }`;
  const functionType = `mint${tokenType}Tokens`;

  console.log(`\n⏱ Minting Tokens...`);
  const mintTx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100000)
    .setFunction(
      functionType,
      new ContractFunctionParameters().addUint64(new BigNumber(amount))
    );
  const mintSubmit = await mintTx.execute(client);
  const mintReceipt = await mintSubmit.getReceipt(client);
  console.log(`The mint transaction was a: ${mintReceipt.status.toString()}`);
  await checkBalances();
}

///////////For Testing//////////////
async function checkBalances() {
  const treasuryId = AccountId.fromString(process.env.OPERATOR_ID);
  const treasuryKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
  const aliceId = AccountId.fromString(process.env.TRANSFER_TEST_ID);
  const bobId = AccountId.fromString(process.env.BOB_ID);
  const sallyId = AccountId.fromString(process.env.SALLY_ID);

  const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);

  const officerTokenId = TokenId.fromString(process.env.DAO_OFFICER_ID);
  const adminTokenId = TokenId.fromString(process.env.DAO_ADMIN_ID);
  const memberTokenId = TokenId.fromString(process.env.DAO_MEMBER_ID);

  const treasuryOffBalance = await checkBalance(treasuryId, officerTokenId);
  const treasuryAdBalance = await checkBalance(treasuryId, adminTokenId);
  const treasuryMemBalance = await checkBalance(treasuryId, memberTokenId);
  console.log(
    `Treasury has: ${treasuryOffBalance} officer tokens, ${treasuryAdBalance} admin tokens, and ${treasuryMemBalance} member tokens`
  );

  const aliceOffBalance = await checkBalance(aliceId, officerTokenId);
  const aliceAdBalance = await checkBalance(aliceId, adminTokenId);
  const aliceMemBalance = await checkBalance(aliceId, memberTokenId);
  console.log(
    `Alice has: ${aliceOffBalance} officer tokens, ${aliceAdBalance} admin tokens, and ${aliceMemBalance} member tokens`
  );

  const bobOffBalance = await checkBalance(bobId, officerTokenId);
  const bobAdBalance = await checkBalance(bobId, adminTokenId);
  const bobMemBalance = await checkBalance(bobId, memberTokenId);
  console.log(
    `Bob has: ${bobOffBalance} officer tokens, ${bobAdBalance} admin tokens, and ${bobMemBalance} member tokens`
  );

  const sallyOffBalance = await checkBalance(sallyId, officerTokenId);
  const sallyAdBalance = await checkBalance(sallyId, adminTokenId);
  const sallyMemBalance = await checkBalance(sallyId, memberTokenId);
  console.log(
    `Sally has: ${sallyOffBalance} officer tokens, ${sallyAdBalance} admin tokens, and ${sallyMemBalance} member tokens`
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

const treasuryId = AccountId.fromString(process.env.OPERATOR_ID);
const treasuryKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const aliceId = AccountId.fromString(process.env.TRANSFER_TEST_ID);
const aliceKey = PrivateKey.fromString(process.env.TRANSFER_TEST_PVKEY);
const bobId = AccountId.fromString(process.env.BOB_ID);
const bobKey = PrivateKey.fromString(process.env.BOB_PVKEY);
const sallyId = AccountId.fromString(process.env.SALLY_ID);
const sallyKey = PrivateKey.fromString(process.env.SALLY_PVKEY);

// const dao = createDao(
//   treasuryId.toString(),
//   treasuryKey.toString(),
//   "Luffy",
//   "LUF",
//   12,
//   30,
//   110
// );

const officerTokenId = TokenId.fromString(process.env.DAO_OFFICER_ID);
const adminTokenId = TokenId.fromString(process.env.DAO_ADMIN_ID);
const memberTokenId = TokenId.fromString(process.env.DAO_MEMBER_ID);
// const contractId = ContractId.fromString(process.env.CONTRACT_ID);
const contractId = ContractId.fromString(process.env.PROXY_CONTRACT_ID);

checkBalances();

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
// 	const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);
// 	const sendHbar = await new TransferTransaction()
// 		.addHbarTransfer(treasuryId, Hbar.fromTinybars(-30000000))
// 		.addHbarTransfer(aliceId, Hbar.fromTinybars(30000000))
// 		.execute(client);
// 	const sendreceipt = await sendHbar.getReceipt(client);
// 	console.log(
// 		"The transfer transaction from my account to the new account was: " +
// 			sendreceipt.status.toString()
// 	);

// 	const query = await new AccountBalanceQuery()
// 		.setAccountId(aliceId)
// 		.execute(client);
// 	console.log(
// 		"The account balance after the transfer is: " +
// 			query.hbars.toTinybars() +
// 			" tinybar."
// 	);
// }
// sendHbar();

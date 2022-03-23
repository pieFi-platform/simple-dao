interface DaoInput {
	daoName: string;
}

declare const enum AccessType {
	None,
	Member,
	Admin,
	Officer,
}

declare namespace NodeJS {
	export interface ProcessEnv {
		OPERATOR_ID: string;
		OPERATOR_PVKEY: string;
		TRANSFER_TEST_ID: string;
		TRANSFER_TEST_PVKEY: string;
		TRANSFER_TEST_PBKEY: string;
		NETWORK: string;
		KEYS: string;
		BIN: string;
		FILE_MEMO: string | undefined;
		EXPIRATION_DAYS: string | undefined;
		CONTRACT_GAS: string;
		CONSTRUCTOR_PARAMS: string | undefined;
		INITIAL_HBAR_BALANCE: string | undefined;
		ADMIN_KEY: string | undefined;
		CONTRACT_MEMO: string | undefined;
		DAO_OFFICER_ID: string;
		DAO_ADMIN_ID: string;
		DAO_MEMBER_ID: string;
		BOB_ID: string;
		BOB_PVKEY: string;
		BOB_PBKEY: string;
		SALLY_ID: string;
		SALLY_PVKEY: string;
		SALLY_PBKEY: string;
		FACTORY_ID: string;
		FACTORY_ADDRESS: string;
		FACTORY_BIN: string;
		FACTORY_ABI: string;
		FACTORY_FUNC_NAME: string;
		FACTORY_FUNC_PARAMS: string;
		IMP_ID: string;
		IMP_ADDRESS: string;
		IMP_BIN: string;
		IMP_ABI: string;
		IMP_FUNC_NAME: string;
		IMP_FUNC_PARAMS: string;
		IMP_OFFICER_ID: string;
		IMP_ADMIN_ID: string;
		IMP_MEMBER_ID: string;
		PROXY_ID: string;
		PROXY_ADDRESS: string;
		PROXY_BIN: string;
		PROXY_ABI: string;
		PROXY_FUNC_NAME: string;
		PROXY_FUNC_PARAMS: string;
		PROXY_OFFICER_ID: string;
		PROXY_ADMIN_ID: string;
		PROXY_MEMBER_ID: string;
		PROXY_NAME: string;
		PROXY_SYMBOL: string;
		NUM_OFFICERS: string;
		NUM_ADMINS: string;
		NUM_MEMBERS: string;
	}
}

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
		PROXY_ACCOUNT_ID: string | undefined;
		CONTRACT_MEMO: string | undefined;
		DAO_OFFICER_ID: string;
		DAO_ADMIN_ID: string;
		DAO_MEMBER_ID: string;
		CONTRACT_ID: string;
		CONTRACT_ADDRESS: string;
		BOB_ID: string;
		BOB_PVKEY: string;
		BOB_PBKEY: string;
		SALLY_ID: string;
		SALLY_PVKEY: string;
		SALLY_PBKEY: string;
	}
}

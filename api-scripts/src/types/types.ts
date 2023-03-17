
export interface I_Address {
	address: string;
	title: string;
}

export interface I_AddressActivity {
	address: I_Address;
	scanned: boolean;
	level: number;
	tokens_withdrew_to: I_Address[];
	tokens_sent_to: I_Address[];
	tokens_received_from: I_Address[];
	withdrawals: {
		symbol: string;
		name: string;
		amount: number;
		date: string;
		date_readable: string;
		to: I_Address;
		hash: string;
	}[];
}

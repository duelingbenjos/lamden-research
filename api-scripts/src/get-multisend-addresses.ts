import axios from "axios";
import { writeJsonToFile } from "./api-methods";
import { log } from "./utils/logger";
import keys from "./api-keys"

const bscscan_api_key = {keys};

const multisend_transactions = [
	"0x123d29f07f7ac9767e8264bb121378983c19c781b799b45cfa4e49f2c29beb17",
	"0xf489c315bf44fc4915ce6cb90162ac417de52dd3c1df27ccfa9b28d65cfa227f",
	"0x9d067f386d48d44f050d612a248c2a6de1a226d03b8e13b4f4d4d14a7e5de311",
	"0x011ea6ebe129b25bdcf769ed77a56565c0a7bdb2ae6167717bf7c3a7cfdd6cc1"
];

// Define the multisend contract address and the multisend transaction hash

// Define the API endpoint URL

// Send a GET request to the API endpoint
export async function getMultisendAddresses(multisend_contract_address: string, multisend_transaction_hash: string) {
	const list: string[] = [];
	// const api_endpoint = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${multisend_contract_address}&sort=asc&apikey=${bscscan_api_key}`;
	const api_endpoint = `https://api.bscscan.com/api?module=account&action=tokentx&address=${multisend_contract_address}&page=1&offset=5000&startblock=10024848&endblock=10025021&sort=asc&apikey=${bscscan_api_key}`;
	const response = await axios.get(api_endpoint);
	log.log({ response });
	for (const transaction of response.data.result) {
		if (transaction.hash === multisend_transaction_hash) {
			list.push(transaction.to);
		}
	}
	return list;
}

(async () => {
	const list: string[] = [];
	for (let tx of multisend_transactions) {
		const add_list = await getMultisendAddresses("0xa5025faba6e70b84f74e9b1113e5f7f4e7f4859f", tx);
		list.push(...add_list);
		log.log({ add_list_length: add_list.length, list_length: list.length });
		writeJsonToFile(list, "multisend-addresses.json");
	}
})();

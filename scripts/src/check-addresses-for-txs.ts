import axios from "axios";
import { log } from "./utils/logger";
import keys from "./api-keys";

const { bscscan_api_key } = keys;

async function getTxHistory(address: string) {
	try {
		const api_endpoint = `https://api.bscscan.com/api?module=account&action=tokentx&address=${address}&page=1&offset=10000&startblock=0&endblock=9999999999&sort=asc&apikey=${bscscan_api_key}`;
		const response = await axios.get(api_endpoint);
		const result = response.data.result;
		return result;
	} catch (error) {
		log.error(error);
		await new Promise((resolve) => setTimeout(resolve, 1500));
		return getTxHistory(address);
	}
}

function loadAddressesFromFile() {
	try {
		const addresses = require("../outputs/multisend-addresses.json");
		return addresses;
	} catch (err) {
		log.log(err);
		return [];
	}
}

function loadInterestingMultiSendAddresssesFromFile(): { address: string; tx_list_length: number }[] {
	try {
		const addresses = require("../outputs/interesting-multisend-addresses.json");
		return addresses;
	} catch (err) {
		// log.log(err);
		return [];
	}
}

function saveInterestingMultiSendAddressesToFile(addresses: { address: string; tx_list_length: number }[]) {
	const fs = require("fs");
	fs.writeFileSync("./outputs/interesting-multisend-addresses.json", JSON.stringify(addresses));
}

async function main() {
	const addresses = loadAddressesFromFile();
	const interesting_addresses = loadInterestingMultiSendAddresssesFromFile();
	const addresses_to_check = addresses.filter((address) => !interesting_addresses.map((a) => a.address).includes(address));
	for (let address of addresses_to_check) {
		const tx_list = await getTxHistory(address);
		log.log({ address, tx_list_length: tx_list.length });
		interesting_addresses.push({ address, tx_list_length: tx_list.length });
		saveInterestingMultiSendAddressesToFile(interesting_addresses);
	}
}

main();

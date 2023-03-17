import {
	addressExists,
	findAddressTitle,
	isBinanceAddress,
	isRelevantAddress,
	parseBnbTransfersByAddress,
	parseTokenTransferEventsByAddress,
	writeJsonToFile
} from "./api-methods";
import binance_addresses from "./addresses/addresses-binance.json";
import { log } from "./utils/logger";
import { I_Address, I_AddressActivity } from "./types/types";

const stu_address = "0x517a13b166816762646b03d3a969826beed4f8e1";
const token_contract = "0xdFa3b0019EcF48c753B58908B5A21d11641bA56f";

export function constructAddressActivity(address: I_Address, level = 0): I_AddressActivity {
	return {
		address,
		scanned: false,
		level,
		tokens_withdrew_to: [],
		tokens_sent_to: [],
		tokens_received_from: [],
		withdrawals: []
	};
}

async function recurseThroughAddresses(addresses: I_AddressActivity[], level = 0, max_depth = 1) {
	const addresses_to_process = addresses.filter((a) => !a.scanned && a.level === level);
	log.log(`Processing ${addresses_to_process.length} addresses at level ${level} ...`);
	for (let a of addresses_to_process) {
		a.scanned = true;
		const tx_list = await parseTokenTransferEventsByAddress(a.address.address);
		const bnb_xfers = await parseBnbTransfersByAddress(a.address.address);
		log.log({bnb_xfers})
		log.log(`Found ${tx_list.length} transactions for ${a.address.address} ...`);

		for (let tx of [...tx_list, ...bnb_xfers]) {
			const other_party_address: string = a.address.address === tx.to ? tx.to : tx.to;

			if (tx.to === a.address.address && !a.tokens_received_from.find((a) => a.address === tx.from)) {
				a.tokens_received_from.push({ address: tx.from, title: findAddressTitle(tx.from) });
			} else if (tx.from === a.address.address && !a.tokens_sent_to.find((a) => a.address === tx.to)) {
				a.tokens_sent_to.push({ address: tx.to, title: findAddressTitle(tx.to) });
			}

			if (isBinanceAddress(tx.to)) {
				a.withdrawals.push({
					symbol: tx.tokenSymbol,
					name: tx.tokenName,
					amount: tx.amount,
					date: tx.timeStamp,
					date_readable: new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
					to: { address: tx.to, title: findAddressTitle(tx.to) },
					hash: tx.hash
				});
			}

			if (!addressExists(addresses, other_party_address) && isRelevantAddress(other_party_address)) {
				addresses.push(constructAddressActivity({ address: other_party_address, title: findAddressTitle(other_party_address) }));
				a.level = level;
			}
		}
	}
	writeJsonToFile(addresses_to_process, `addresses_${level}.json`);
	if (level < max_depth) {
		await recurseThroughAddresses(addresses, level + 1, max_depth);
	}
}

function loadJsonFromFile(filename: string): I_AddressActivity[] {
	const fs = require("fs");
	const path = require("path");
	const data = fs.readFileSync(path.join(__dirname, filename), "utf8");
	return JSON.parse(data);
}

async function main() {
	// const addresses = loadJsonFromFile("filename.json");
	await recurseThroughAddresses([
		constructAddressActivity({
			address: "0x6f2693c510c0aed90839b4d2c4b687e346048ab7",
			title: findAddressTitle("0x6f2693c510c0aed90839b4d2c4b687e346048ab7")
		})
	]);
}

main();

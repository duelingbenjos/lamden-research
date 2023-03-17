import axios from "axios";
import { findAddressTitle, getCoingeckoDateFromTimestamp, writeJsonToFile } from "./api-methods";
import { log } from "./utils/logger";
import keys from "./api-keys";
import usdPriceService, { findCoinName } from "./usd-price-service";
import pancake_addresses from "./addresses/addresses-pancake.json";
const fs = require("fs");

const { bscscan_api_key } = keys;

async function getTokenTransfers(address: string, start_block: number, endblock: number) {
	const api_endpoint = `https://api.bscscan.com/api?module=account&action=tokentx&address=${address}&page=1&offset=10000&startblock=${start_block}&endblock=${endblock}&sort=asc&apikey=${bscscan_api_key}`;
	const response = await axios.get(api_endpoint);
	const result = response.data.result;
	return result;
}

function transformTransactions(result) {
	const whitelisted_tokens: string = fs.readFileSync("token_whitelist.json").toString();

	const filtered = result.filter((r) => {
		// if (!unique_token_list.includes(r.tokenName)) unique_token_list.push(r.tokenName);
		return whitelisted_tokens.includes(r.tokenName);
	});

	const transformed = filtered.map((e) => {
		return {
			hash: e.hash,
			value: e.value,
			blockNumber: e.blockNumber,
			timeStamp: e.timeStamp,
			time_readable: new Date(Number(e.timeStamp) * 1000).toUTCString(),
			tokenName: e.tokenName,
			tokenSymbol: e.tokenSymbol,
			tokenDecimal: e.tokenDecimal,
			amount: Number(e.value) / 10 ** Number(e.tokenDecimal),
			to: e.to,
			to_title: findAddressTitle(e.to),
			from: e.from,
			from_title: findAddressTitle(e.from)
		};
	});
	// fs.writeFileSync("./unique_token_list.json", JSON.stringify(unique_token_list));
	return transformed;
}

function truncateWalletAddresss(address: string) {
	return address.slice(0, 6) + "..." + address.slice(-4);
}

function isPancakeAddress(address: string) {
	return pancake_addresses.find((a) => a.address.toLowerCase() === address.toLowerCase());
}

(async () => {
	const address = "0xA3ECc09E7a1Ad66Ee28a7AbAAC4577A1F8BE636D";
	const xfers = await getTokenTransfers(address, 10050368, 13917046);
	const transformed = transformTransactions(xfers);
	const received_by_address = {};
	for (let t of transformed) {
		const coin_name = findCoinName(t.tokenSymbol);
		if (t.to.toLowerCase() === address.toLocaleLowerCase()) continue;
		if (!received_by_address[t.to])
			received_by_address[t.to] = {
				address_title: t.to_title,
				received: {},
				transactions: []
			};
		if (!received_by_address[t.to]["received"][t.tokenSymbol]) {
			received_by_address[t.to]["received"][t.tokenSymbol] = {
				amount: t.amount,
				usd_value: (await usdPriceService.getPrice(findCoinName(t.tokenSymbol), getCoingeckoDateFromTimestamp(t.timeStamp))) * t.amount
			};
		} else {
			received_by_address[t.to]["received"][t.tokenSymbol]["amount"] += t.amount;
			received_by_address[t.to]["received"][t.tokenSymbol]["usd_value"] +=
				(await usdPriceService.getPrice(findCoinName(t.tokenSymbol), getCoingeckoDateFromTimestamp(t.timeStamp))) * t.amount;
		}
		received_by_address[t.to]["transactions"].push(t.hash);
	}
	writeJsonToFile(received_by_address, `received-by-address-${truncateWalletAddresss(address)}-bsc.json`);

	let total_usd_value_sent = 0;
	let total_eth_sent = 0;
	let total_usd_sent = 0;

	Object.keys(received_by_address).forEach((address) => {
		const received = received_by_address[address]["received"];
		Object.keys(received).forEach((token) => {
			total_usd_value_sent += received[token]["usd_value"];
			total_eth_sent += received["ETH"] ? received["ETH"]["amount"] : 0;
			total_usd_sent += received["BSC-USD"] ? received["BSC-USD"]["amount"] : 0;
		});
	});
	log.log(`Total USD VALUE sent: ${total_usd_value_sent}`);
	log.log(`Total ETH sent: ${total_eth_sent}`);
	log.log(`Total USD sent: ${total_usd_sent}`);
})();

/**
 * 21:08:23 <LOG> [get_token_transfers.ts:92] Total USD sent: 1712462.097978527
 * 21:08:23 <LOG> [get_token_transfers.ts:93] Total ETH sent: 256.99825928044135
 * 
 * Etherscan shows 159.55 ETH sent from wallet 0xa3ecc09e7a1ad66ee28a7abaac4577a1f8be636d to the bridge
 */

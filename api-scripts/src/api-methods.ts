import axios from "axios";
import lamden_addresses from "./addresses/addresses-lamden.json";
import binance_addresses from "./addresses/addresses-binance.json";
import pancake_addresses from "./addresses/addresses-pancake.json";
import keys from "./api-keys";

import { log } from "./utils/logger";
import { I_AddressActivity } from "./types/types";

const fs = require("fs");

const { bscscan_api_key } = keys;

export async function getTokenTransferEventsByAddress(address: string) {
	return (
		await axios.get(
			`https://api.bscscan.com/api?module=account&action=tokentx&address=${address}&page=1&offset=10000&startblock=0&endblock=15145807&sort=asc&apikey=${bscscan_api_key}`
		)
	).data as {
		status: string;
		message: string;
		result: I_TokenTransferEventsByAddress[];
	};
}

export async function getBnbTransfersByAddress(address: string) {
	return (
		await axios.get(
			`https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${bscscan_api_key}`
		)
	).data as {
		status: string;
		message: string;
		result: I_NormalTransaction[];
	};
}

export async function getTxInfo(hash: string, address: string, topic: string) {
	const endpoint = `https://api.bscscan.com/api?module=logs&action=getLogs&fromBlock=0&toBlock=999999999999&address=${address}&topic0=${topic}&apikey=${bscscan_api_key}`;
	const res = await axios.get(endpoint);
}

export async function parseBnbTransfersByAddress(address: string) {
	try {
		const response = await getBnbTransfersByAddress(address);
		if (response.status !== "1") {
			throw new Error(response.message);
		}
		const { result } = response;
		const filtered = result.filter((r) => {
			return r.value !== "0";
		});
		const transformed = filtered.map((e) => {
			return {
				hash: e.hash,
				value: Number(e.value) / 10 ** Number(18),
				amount: Number(e.value) / 10 ** Number(18),
				blockNumber: e.blockNumber,
				timeStamp: e.timeStamp,
				to: e.to,
				tokenName: "BNB",
				tokenSymbol: "BNB",
				to_title: findAddressTitle(e.to),
				from: e.from,
				from_title: findAddressTitle(e.from)
			};
		});
		return transformed;
	} catch (err) {
		// log.error(err);
		log.log("parse bnb transfers found an error trying again...in 1s");
		await new Promise((r) => setTimeout(r, 1000));
		return await parseBnbTransfersByAddress(address);
	}
}

export async function parseTokenTransferEventsByAddress(address: string) {
	try {
		const response = await getTokenTransferEventsByAddress(address);
		const whitelisted_tokens: string[] = fs.readFileSync("token_whitelist.json").toString();
		// const whitelisted_tokens: string[] = []
		if (response.status !== "1") {
			throw new Error(response.message);
		}
		const { result } = response;

		// const unique_token_list = JSON.parse(fs.readFileSync("unique_token_list.json").toString());
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
	} catch (err) {
		log.log(err);
		log.log("Error parsing token transfer events by address, trying again in 1s ...");
		await new Promise((r) => setTimeout(r, 1000));
		return await parseTokenTransferEventsByAddress(address);
	}
}

export function jsonToCsv() {
	const fs = require("fs");
	const csv = require("csv-parser");
	const results: any[] = [];

	fs.createReadStream("data.json")
		.pipe(csv())
		.on("data", (data) => results.push(data))
		.on("end", () => {
			log.log(results);
		});
}

export function createCsvFromJsonFile() {}

export function writeJsonToFile(parsed: any, filename: string = "data.json") {
	const data = JSON.stringify(parsed);
	fs.writeFileSync(`outputs/${filename}`, data);
}

const response = {
	blockNumber: "12697033",
	timeStamp: "1637067841",
	hash: "0xcf05acd60f7bba301edea5543c085076694122319aabf236c5c3b502ea1295b9",
	nonce: "84",
	blockHash: "0x4f89ada572ac4ea970f74b521b8d9c0f02b2bbca7ce5daba011c4f6c4f08f677",
	from: "0x517a13b166816762646b03d3a969826beed4f8e1",
	contractAddress: "0xdfa3b0019ecf48c753b58908b5a21d11641ba56f",
	to: "0xa3ecc09e7a1ad66ee28a7abaac4577a1f8be636d",
	value: "2000000000000000000000000",
	tokenName: "Lamden",
	tokenSymbol: "TAU",
	tokenDecimal: "18",
	transactionIndex: "1772",
	gas: "54102",
	gasPrice: "5010000000",
	gasUsed: "36068",
	cumulativeGasUsed: "81813146",
	input: "deprecated",
	confirmations: "13194187"
};

export function findAddressTitle(address: string) {
	const found =
		lamden_addresses.find((e) => e.address.toLowerCase().includes(address)) ||
		binance_addresses.find((e) => e.address.toLowerCase().includes(address)) ||
		pancake_addresses.find((e) => e.address.toLowerCase().includes(address));
	return found?.title || "Unknown";
}

export function isRelevantAddress(address: string) {
	const uninteresting = ["0x0000000000000", ...pancake_addresses.map((e) => e.address)];
	const filtered = uninteresting.find((u) => address.toLowerCase().includes(u.toLowerCase()));
	// console.log(filtered)	// log.log(!filtered);
	return !filtered;
}

export function addressExists(addresses: I_AddressActivity[], other_party_address: string) {
	const result = addresses.find((a) => a.address.address === other_party_address);
	return result;
}

export function isBinanceAddress(address: string) {
	const result = binance_addresses.find((b) => b.address.toLowerCase() === address.toLowerCase());
	return result;
}

export function getCoingeckoDateFromTimestamp(timestamp: number) {
	const tx_date = new Date(timestamp * 1000);
	const date = `${tx_date.getDate()}-${tx_date.getMonth() + 1}-${tx_date.getFullYear()}`;
	return date;
}

const normal_transaction = {
	blockNumber: "24693689",
	timeStamp: "1673440776",
	hash: "0xc123ab883f83beb6cb28134c30373727bc9cd67a35c9d5c5ce49b80344403fec",
	nonce: "36",
	blockHash: "0x6f8b06368e6654571b2799a3332f4ec45cba810e44d186a99f77904dfd3aa4d4",
	transactionIndex: "29",
	from: "0x96fe655517cadddb4724c40e8972acbe9ee6b8db",
	to: "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
	value: "15774194834000000000",
	gas: "42000",
	gasPrice: "5000000000",
	isError: "0",
	txreceipt_status: "1",
	input: "0x",
	contractAddress: "",
	cumulativeGasUsed: "3964788",
	gasUsed: "21000",
	confirmations: "1462476",
	methodId: "0x",
	functionName: ""
};

interface I_NormalTransaction {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	nonce: string;
	blockHash: string;
	transactionIndex: string;
	from: string;
	to: string;
	value: string;
	gas: string;
	gasPrice: string;
	isError: string;
	txreceipt_status: string;
	input: string;
	contractAddress: string;
	cumulativeGasUsed: string;
	gasUsed: string;
	confirmations: string;
	methodId: string;
	functionName: string;
}

interface I_TokenTransferEventsByAddress {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	nonce: string;
	blockHash: string;
	from: string;
	contractAddress: string;
	to: string;
	value: string;
	tokenName: string;
	tokenSymbol: string;
	tokenDecimal: string;
	transactionIndex: string;
	gas: string;
	gasPrice: string;
	gasUsed: string;
	cumulativeGasUsed: string;
	input: string;
	confirmations: string;
}

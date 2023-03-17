import axios from "axios";
import { writeJsonToFile } from "./api-methods";
import { log } from "./utils/logger";

export async function getCoinPriceHistory(coin: string, date: string): Promise<{ market_data: { current_price: { usd: number } } }> {
	log.log({
		coin,
		date
	});
	const endpoint = `https://api.coingecko.com/api/v3/coins/${coin}/history?date=${date}&localization=false`;
	// log.log(endpoint)
	return (await axios.get(endpoint)).data as {
		market_data: {
			current_price: {
				usd: number;
			};
		};
	};
}

type T_Coin = "binancecoin" | "ethereum" | "bitcoin" | "dogecoin" | "polkadot" | "lamden";

const coin_names: string[] = ["binancecoin", "ethereum", "bitcoin", "dogecoin", "polkadot", "lamden", "usd"];
const coins_by_symbol: { [key: string]: string } = {
	BNB: "binancecoin",
	ETH: "ethereum",
	BTC: "bitcoin",
	DOGE: "dogecoin",
	DOT: "polkadot",
	TAU: "lamden",
	"BSC-USD": "usd"
};

export function findCoinName(symbol: string): string {
	if (!coins_by_symbol[symbol]) throw new Error(`no coin name found for symbol ${symbol}`);
	else {
		return coins_by_symbol[symbol];
	}
}

function writeCoinPricesToJson(data) {
	writeJsonToFile(data, "coin-prices.json");
}

function getCoinPricesIfFileExists() {
	try {
		return require("../outputs/coin-prices.json");
	} catch (e) {
		return false;
	}
}

class UsdPriceService {
	private prices: {
		[key: string]: {
			[key: string]: number;
		};
	} = getCoinPricesIfFileExists() || {};

	private last_price = 0;

	constructor() {
		coin_names.forEach((coin) => {
			if (!this.prices[coin]) this.prices[coin] = {};
		});
	}

	async getPrice(coin: string, date: string) {
		try {
			if (coin === "usd") return 1;
			if (this.prices[coin][date]) {
				log.log(`price for ${coin} on ${date} already exists`);
			} else {
				log.log(`getting price for ${coin} on ${date}...`);
				const response = await getCoinPriceHistory(coin, date);
				await new Promise((resolve) => setTimeout(resolve, 10000));
				const price = response.market_data.current_price.usd;
				log.log(price);
				this.prices[coin][date] = price;
				writeCoinPricesToJson(this.prices);
				this.last_price = price;
			}
			return this.prices[coin][date];
		} catch (err) {
			log.error(`couldn't get price for ${coin} on ${date}`);
			return this.last_price;
		}
	}

	async setPrice(coin: string, date: string, price: number) {
		this.prices[coin][date] = price;
	}
}

const usdPriceService = new UsdPriceService();

export default usdPriceService;

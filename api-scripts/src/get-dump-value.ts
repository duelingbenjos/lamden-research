import { parseTokenTransferEventsByAddress } from "./api-methods";
import { log } from "./logger";
import usdPriceService from "./usd-price-service";
import pancake_addresses from "./addresses/addresses-pancake.json";

const addresses = ["0x6f2693c510c0aed90839b4d2c4b687e346048ab7"];
// const addresses = ["0xa3ecc09e7a1ad66ee28a7abaac4577a1f8be636d"];


async function getDumpValues(addresses: string[]) {
	const dump_values: {
		[key: string]: {
			usd: number;
			tau: number;
		};
	} = {};
	addresses.forEach((address) => {
		dump_values[address] = {
			usd: 0,
			tau: 0
		};
	});

	for (let i = 0; i < addresses.length; i++) {
		const address = addresses[i];
		const transactions = await parseTokenTransferEventsByAddress(address);
		const tau_sells = transactions.filter((tx) => tx.to_title.toLowerCase().includes("pancake") && tx.tokenSymbol === "TAU");

		for (let j = 0; j < tau_sells.length; j++) {
			const tx = tau_sells[j];
			const tx_date = new Date(Number(tx.timeStamp) * 1000);
			const tx_date_string = `${tx_date.getDate()}-${tx_date.getMonth() + 1}-${tx_date.getFullYear()}`;
			log.log({ tx_date_string });
			const lamden_usd_price = await usdPriceService.getPrice("lamden", tx_date_string);
			dump_values[address]["usd"] += Number(tx.amount) * lamden_usd_price;
			dump_values[address]["tau"] += Number(tx.amount);
			log.log(`sold ${tx.amount} TAU for ${Number(tx.amount) * lamden_usd_price} USD on ${tx_date_string} @ ${lamden_usd_price}`);
			log.log(`processing ${address} ${j}/${tau_sells.length} ${dump_values[address]["usd"]}, ${dump_values[address]["tau"]}`);
		}
	}
	log.log({ dump_values });
}

(async () => {
	await getDumpValues(addresses);
})();

//     '0x6f2693c510c0aed90839b4d2c4b687e346048ab7': { usd: 1484251.4107722826, tau: 6999999.999999994 }

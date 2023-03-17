import { log } from "./utils/logger";

function loadInterestingMultiSendAddresssesFromFile() {
	try {
		const addresses = require("../outputs/interesting-multisend-addresses.json");
		return addresses;
	} catch (err) {
		return [];
	}
}

function main() {
	const addresses = loadInterestingMultiSendAddresssesFromFile();
	const interesting_addresses = addresses.filter((address) => address.tx_list_length > 1);
	log.log({ addrresses_length: addresses.length, interesting_addresses_length: interesting_addresses.length });
    log.log({interesting_addresses})
}

main();

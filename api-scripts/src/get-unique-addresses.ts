const fs = require("fs");

function readJsonFromFile() {
	const data = fs.readFileSync("data.json");
	return JSON.parse(data);
}

export function getUniqueAddresses(data: any) {
	// const data = readJsonFromFile();
	const addresses = data.reduce((acc: any[], curr: any) => {
		if (!acc.includes(curr.to)) {
			acc.push(curr.to);
		}
		if (!acc.includes(curr.from)) {
			acc.push(curr.from);
		}
		return acc;
	}, []);
	console.log(addresses);
}
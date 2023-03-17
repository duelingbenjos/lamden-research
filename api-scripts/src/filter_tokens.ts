const fs = require("fs");

function readJsonFromFile() {
    const data = fs.readFileSync("data.json");
    return JSON.parse(data);
}

function getTokenNames() {
    const data = readJsonFromFile();
    const tokenNames = data.reduce((acc: any[], curr: any) => {
        if (!acc.includes(curr.tokenName)) {
            acc.push(curr.tokenName);
        }
        return acc;
    },[])
    console.log(tokenNames)
    return tokenNames;
}

getTokenNames()
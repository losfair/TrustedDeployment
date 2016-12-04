const request = require("request");
const process = require("process");
const fs = require("fs");
const crypto = require("crypto");

if(process.argv.length != 4) {
    throw "Bad usage";
}

const serverAddr = process.argv[2];
const pkgPath = process.argv[3];
const sigPath = pkgPath + ".sha256.asc";

const pkgRawData = fs.readFileSync(pkgPath);

try {
    var sigData = fs.readFileSync(sigPath, "utf-8");
} catch(e) {
    const pkgHash = crypto.createHash("sha256").update(pkgRawData).digest("hex");
    fs.writeFileSync(pkgPath + ".sha256", pkgHash);
    console.log("Please sign " + pkgPath + ".sha256");
    process.exit(0);
}

const pkgData = pkgRawData.toString("base64");

request.post({
    url: serverAddr,
    body: JSON.stringify({
        "signature": sigData,
        "package": pkgData
    }),
    "headers": {
        "Content-Type": "application/json"
    }
}, (err, resp, body) => {
    if(err) throw err;
    console.log(body);
});

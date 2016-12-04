const cfg = require("./Configuration.js");
const verifier = require("./Verify.js");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const randomstring = require("randomstring");
const crypto = require("crypto");
const child_process = require("child_process");

cfg.load();

const app = express();

app.use(bodyParser.json());

app.post("/deploy", (req, resp) => {
    if(!req.body.signature || !req.body.package) {
        resp.send("Invalid request");
        return;
    }

    var result = verifier.verify(req.body.signature);

    if(!result || result.packets[0].verified !== true) {
        resp.send("Not verified");
        return;
    }

    var signTime = Date.parse(result.packets[0].created);
    try {
        var lastSignTime = fs.readFileSync("/etc/TrustedDeployment/lastSignTime");
        lastSignTime = parseInt(lastSignTime);
    } catch(e) {
        var lastSignTime = 0;
    }

    if(signTime <= lastSignTime) {
        resp.send("Requested package is older than or equal to the current version in time.");
        return;
    }

    var pkgHash = result.text.trim();

    var pkgData = Buffer.from(req.body.package, "base64");
    var currentPkgHash = crypto.createHash("sha256").update(pkgData).digest("hex");

    if(pkgHash != currentPkgHash) {
        resp.send("Hash does not match: " + pkgHash + " and " + currentPkgHash + ".");
        return;
    }

    fs.writeFileSync("/etc/TrustedDeployment/lastSignTime", signTime.toString());

    resp.send("OK");

    console.log("[" + new Date().toISOString() + "] Deployment start: " + pkgHash + " " + new Date(signTime).toISOString())

    var tmpPkgName = "td-" + randomstring.generate(16) + ".tar.gz";
    var tmpPkgPath = "/tmp/" + tmpPkgName;

    fs.writeFile(tmpPkgPath, pkgData, (err) => {
        if(err) {
            console.log("[" + new Date().toISOString() + "] Deployment failed: Unable to write to " + tmpPkgPath + ": " + err);
            return;
        }
        child_process.exec("cd / && gzip -d < \"" + tmpPkgPath + "\" | tar x",
            (err, stdout, stderr) => {
                if(err) {
                    console.log("[" + new Date().toISOString() + "] Deployment failed: Unable to extract package: " + err + " " + stderr);
                    return;
                }
                console.log("[" + new Date().toISOString() + "] Deployment done");
        });
    })
})

app.listen(3099);
const fs = require("fs");
const openpgp = require("openpgp");

function load(cfgPath) {
    if(!cfgPath) cfgPath = "/etc/TrustedDeployment/config.json";
    var cfgData = fs.readFileSync(cfgPath, "utf-8");
    cfgData = JSON.parse(cfgData);
    var pubKeyData = fs.readFileSync(cfgData.trustedKeyPath, "utf-8");
    var pk = openpgp.key.readArmored(pubKeyData);
    module.exports.publicKey = pk.keys;
}

module.exports.load = load;

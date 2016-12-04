const cfg = require("./Configuration.js");
const openpgp = require("openpgp");

function verify(msg) {
    var sig = openpgp.cleartext.readArmored(msg);
    var verified = sig.verify(cfg.publicKey);
    if(!verified || verified.length <= 0 || !verified[0].valid) return null;
    return sig;
}

module.exports.verify = verify;

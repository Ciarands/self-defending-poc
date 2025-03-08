const checkLength = 3; // the higher the length the more difficult this attack becomes

// -----

const fs = require('node:fs');
const crypto = require('crypto');

function sha256(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

const data = fs.readFileSync('./samples/short_hash.js', 'utf8').split("\n")[1];
const formattedData = data.substring(1, data.length - 4); // strip data out of scope
const startingHash = sha256(formattedData);
const hashPrefix = startingHash.substring(0, checkLength);

console.log("Starting Hash:", startingHash);

// TARGET:
// f = !n, r[e(272)](c[e(244)]) ? (console[e(281)](c[e(213)], !g), console[e(281)](c[e(229)], f), f && (n = c[e(206)](function(n) {
//     let r = e;
//     return n[r(276)](/[a-zA-Z]/g, function(n) {
//         var e = r;
//         return String[e(280) + "de"](c[e(214)](n[e(253)](0), c[e(252)](n[e(274) + "e"](), "n") ? -13 : 13))
//     })
// }, c[e(227)]), console[e(281)](n))) : (g = 0, console[e(281)](c[e(213)], !g, c[e(242)]), process[e(277)](0))

// f = !n <-- we are attacking this

let modifiedData = data.replace("f=!n", "f=true");
let newHash = "";

while (true) {
    newHash = sha256(modifiedData.substring(1, modifiedData.length - 4));
    if (newHash.startsWith(hashPrefix)) {
        break;
    }
    modifiedData = modifiedData.replace("()=>{", "()=>{ ");
}

console.log("Modified Hash:", newHash);
console.log(modifiedData);
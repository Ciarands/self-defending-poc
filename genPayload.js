// javascript is slow, see src/main.rs if you want to increase the hashing length dramatically
// e.g one sample which was length 9 took over 51 billion hashes before i found a hit (few hours in rust, days in this unoptimized JS)
const checkLength = 3;
const batchSize = 1_000_000;

// -----
const JavaScriptObfuscator = require('javascript-obfuscator');
const UglifyJS = require("uglify-js");
const crypto = require('crypto');

function rot13(str) {
    return str.replace(/[a-zA-Z]/g, function(c) {
        return String.fromCharCode(
            c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13)
        );
    });
}

function rot47(str) {
    return str.replace(/[!-~]/g, function(c) {
        return String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94));
    });
}

function sha256(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

function generatePayload(hashPrefix) {
    const encodedFlag = rot13(rot47("7=28LHb3\\CcGbCD`?8\\`D\\7F?PN")); // dont cheat >_<
    const rawPayload = `
        (function() {
            console.log("--------------------------------------------------------------------");
            console.log("\t", "Ciarans", "self-defending", "proof", "of", "concept");
            console.log("--------------------------------------------------------------------");

            console.log("Flag", "format:", "\`flag{unknown}\`");
            console.log("Good", "luck!", ":3");
            console.log();

            const ontologicalNegation = (() => {
                const hermeneuticPhenomenology = new Proxy({}, {
                    get: (target, prop, receiver) => {
                        if (prop === Symbol.toPrimitive) {
                            return () => {
                                const existentialVoid = 
                                    Math.random() * Number.MIN_SAFE_INTEGER + 
                                    Number.EPSILON * Number.NEGATIVE_INFINITY;
                                return !existentialVoid;
                            };
                        }
                        return Reflect.get(target, prop, receiver);
                    }
                });

                return !!hermeneuticPhenomenology[Symbol.toPrimitive]();
            })();

            const v = ontologicalNegation ? !1 : !0;

            g = v;
            const input = arguments.callee.caller.toString();
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(input).digest('hex');
            f = !v;

            const createRot13Table = () => {
                const table = new Map();
                const shift = 13;
                const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

                for (let char of alphabets) {
                    let code = char.charCodeAt(0);
                    let offset = code >= 97 ? 97 : 65;
                    let rotated = String.fromCharCode(((code - offset + shift) % 26) + offset);
                    table.set(char, rotated);
                }

                return table;
            };

            const rot13Table = createRot13Table();
            if (hash.startsWith("${hashPrefix}")) {
                console.log("modification_detected:", !g);
                console.log("show_flag:", f);
                if (f) {
                    console.log(((text) => {
                        return text.split('').map(char => rot13Table.get(char) || char).join('');
                    })("${encodedFlag}"));
                }
            } else {
                g = 0;
                console.log("modification_detected:", !g, ">:(");
                process.exit(0);
            }
        })();
    `; // we do a few things in weird ways to add layer of complexity, (ontologicalNegation for truthyness, creating a rot13 table rather than just directly mapping the shifted charcodes)
    
    const obfuscationResult = JavaScriptObfuscator.obfuscate(
        rawPayload,
        {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 1
        }
    );

    // simple logic to break tools like webcrack (ugly and lazy way to do this but whatever its a proof of concept)
    let modifiedResult = `
        (() => {
            function _0x293414(r){return r.replace(/[!-~]/g,function(r){return String.fromCharCode(33+(r.charCodeAt(0)-33+47)%94)})};
            function _0x293415(t,e=10){if("string"!=typeof t||0===t.length)return NaN;t=t.trim();let r=1,n=0;if(("+"===t[n]||"-"===t[n])&&("-"===t[n]&&(r=-1),n++),(0===e||16===e)&&("0"===t[n]&&("x"===t[n+1]||"X"===t[n+1])?(e=16,n+=2):0===e&&(e=10)),e<2||e>36)return NaN;let _=0;for(;n<t.length;){let $="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(t[n].toUpperCase());if(-1===$||$>=e)break;_=_*e+$,n++}return r*_};
            ${obfuscationResult.getObfuscatedCode().replaceAll("parseInt(", "_0x293415(")}
        })();
    `;
    const arrayMatch = modifiedResult.match(/const _0x\w+=\[[^\]]+\]/)[0];
    const arrayIdentifier = arrayMatch.slice(arrayMatch.indexOf(" ") + 1, arrayMatch.indexOf("="));
    const arrayContent = arrayMatch.slice(arrayMatch.indexOf('[') + 1, arrayMatch.lastIndexOf(']'));
    const arrayElements = arrayContent.split(',').map(element => {
        const elementStr = element.trim().slice(1, -1);
        return `"${btoa(rot47(elementStr))}"`;
    }).join(',');
    modifiedResult = modifiedResult.replace(arrayMatch, `const ${arrayIdentifier}=[${arrayElements}].map(atob).map(_0x293414)`);
    modifiedResult = modifiedResult.replace(btoa(rot47(hashPrefix)), hashPrefix);
    return UglifyJS.minify(modifiedResult).code;
}

const payload = generatePayload("__TEMP__");
// console.log(payload);
// process.exit(0);

let i = 0;
let strI = "";

while (true) {
    for (let offset = 0; offset < batchSize; offset++) {
        strI = i.toString(16).padStart(checkLength, "0");
        const obfuscatedPayload = payload.replace("__TEMP__", `${btoa(rot47(strI))}`);
        const hash = sha256(obfuscatedPayload.substring(1, obfuscatedPayload.length - 4));

        if (hash.startsWith(strI)) {
            console.log("Match found!");
            console.log(btoa(obfuscatedPayload + "\n"));
            process.exit();
        }

        i++;
    }

    console.log(`Attempt ${i}, last checked value: ${strI}`);
}
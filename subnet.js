
/**
Inge UI-afhængighed, testes direkte i konsollen

der skal parses en IP-streng til et array af 4 oktetter
@param {string} ipString fx "192.168.1.0"
@returns {number[]}      fx [192, 168, 1, 0]
@throws {Error}          hvis IP-adressen er ugyldig
**/
function parseIP (ipString) {
  const parts = ipString.trim().split(".");
  if (parts.length !==4) throw new Error (`Invalid IP address: "${ipString}"`);

  const octets = parts.map((p) => {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) {
      throw new Error (`Invalid octet "${p}" in "${ipString}"`);
    }
    return n;
  });

  return octets;
}
/** 
Konverterer 4 oktetter til et 32-bit heltal.
@param {number[]} octets fx [192, 168, 1, 0]
@returns {number}  usignet 32-bit integer
*/ 
function ipToInt(octets) {
  return (
    ((octets[0] << 24) |
     (octets[1] << 16) |
     (octets[2] << 8) |
     octets[3]) >>>
    0 // >>> sikrer usinget 32-bit
    );
}
/**
Konverterer et 32-bit heltal tilbage til IP-streng.
@param {number} int usignet 32-bit integer
@returns {string}   fx. "192.168.1.0"
*/
function intToIp(int) {
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8)  & 0xff,
    int          & 0xff,
    ].join(".");
}

/** funktion der validerer at et prefix er et heltal mellem 0 og 32
@param {number} prefix
@throws {Error}
*/
function validatePrefix(prefix) {
  if(!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`Invalid prefix: /${prefix} (must be 0-32)`);
  }
}

// Subnet beregninger herunder
// på en eller anden måde beregner subnet mask som 32-bit integer
// @param {nuber} prefix fx 24
//@returens {number}fx 0xFFFFFF00

function getMaskInt(prefix) {
  validatePrefix(prefix); 
  //Prefix 0 er et edge case - ~0 >>> 0 giver ikke 0
  if (prefix === 0) return 0;
  return (~0 << (32 - prefix)) >>> 0;
}

// Funktion her som beregner subnet mask som decial-streng

//funktion her som beregner subnet mask som binær streng (med punktummer)

//funktion her som beregner network-addressen (host bits sat til 0).

//funktion som skal beregne første brugerbare host-adresse og sidste
// måske 2 forskellige funktioner
// også en som beregner total antal af brugerbare hosts i et subnet formel: 2^(32 - prefix) -2
// funktion der beregner det totale antal adresser i et subnet (inkl. network+broadcast)
//Hjælpefunktioner:
//En der konverterer et 32-bit integer til binær streng med punktumer
//En der returnerer IP-adressen som binær streng med punktumer
//En der returnerer et objekt med bits opdelt i netowrk- og host delen, brug til bit-visualisering
//En der returnerer alle beregninger samlet i et objekt - 
// Hoveddatastruktur som main.js og visualizer.js bruger. 
  

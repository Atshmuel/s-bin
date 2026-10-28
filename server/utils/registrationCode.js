import { randomInt, timingSafeEqual } from "node:crypto";
import { REGISTRATION_CODE_ALPHABET, REGISTRATION_CODE_LENGTH } from "./constants.js";

// An organization's device registration code (see REGISTRATION_CODE_ALPHABET).

// A new random code, as "XXXX-XXXX".
export function generateRegistrationCode() {
    const characters = Array.from({ length: REGISTRATION_CODE_LENGTH },
        () => REGISTRATION_CODE_ALPHABET[randomInt(REGISTRATION_CODE_ALPHABET.length)]).join("");
    return `${characters.slice(0, 4)}-${characters.slice(4)}`;
}

const normalize = code => typeof code === "string" ? code.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";

// Whether a code someone typed is the organization's, without case or dashes;
// compared in constant time.
export function registrationCodeMatches(typed, expected) {
    const a = Buffer.from(normalize(typed));
    const b = Buffer.from(normalize(expected));
    return b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

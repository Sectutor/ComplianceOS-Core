
const BASE = "https://raw.githubusercontent.com/OWASP/ASVS/v4.0.3/4.0/en/";

async function main() {
    for (let v = 1; v <= 14; v++) {
        const found = false;
        for (let h = 0x01; h <= 0x30; h++) {
            const hex = "0x" + h.toString(16).padStart(2, '0');
            // I'll try to catch whatever comes after V${v}
            // But I can't do glob with fetch.
            // I'll try common names.
        }
    }
}

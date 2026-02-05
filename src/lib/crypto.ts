export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as any,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(text: string, password: string): Promise<string> {
    if (!text) return '';
    try {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(password, salt);
        const enc = new TextEncoder();

        const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            enc.encode(text)
        );

        // Convert to Base64 strings for storage
        const saltB64 = btoa(String.fromCharCode(...Array.from(salt)));
        const ivB64 = btoa(String.fromCharCode(...Array.from(iv)));
        const dataB64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(encrypted))));

        return `${saltB64}:${ivB64}:${dataB64}`;
    } catch (e) {
        console.error("Encryption failed", e);
        throw new Error("Encryption failed");
    }
}

export async function decryptData(encryptedText: string, password: string): Promise<string> {
    if (!encryptedText) return '';
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) throw new Error("Invalid encrypted format");

        const salt = Uint8Array.from(atob(parts[0]), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
        const data = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));

        const key = await deriveKey(password, salt);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        throw new Error("Incorrect Password or Data Corrupted");
    }
}

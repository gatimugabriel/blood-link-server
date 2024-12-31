    import crypto from 'node:crypto'
    import dotenv from 'dotenv'
    dotenv.config()

    if (!process.env["ENCRYPTION_KEY"] || !process.env["ENCRYPTION_IV"]) {
        throw new Error("Encryption key or IV is not set in the environment variables");
    }
    const key = Buffer.from(process.env["ENCRYPTION_KEY"] as string, 'hex')
    const iv = Buffer.from(process.env["ENCRYPTION_IV"] as string, 'hex')

    //  returns an encrypted string
    //  input: payload of any type (string, object, array)
    export const encryptPayload = (payload: string | object): string => {
        const plainText = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        return cipher.update(plainText, 'utf8', 'hex') + cipher.final('hex');
    }

    export const decryptPayload = (encryptedString: string): any => {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const decrypted = decipher.update(encryptedString, 'hex', 'utf8') + decipher.final('utf8');
        try {
            return JSON.parse(decrypted);
        } catch (e) {
            return decrypted;
        }
    }




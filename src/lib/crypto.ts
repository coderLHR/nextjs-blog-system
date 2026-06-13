import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'default-secret-change-in-production'

export function encryptKey(plainText: string): { encrypted: string; iv: string } {
  const iv = CryptoJS.lib.WordArray.random(16).toString()
  const key = CryptoJS.SHA256(SECRET_KEY)
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return { encrypted: encrypted.toString(), iv }
}

export function decryptKey(encrypted: string, iv: string): string {
  const key = CryptoJS.SHA256(SECRET_KEY)
  const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

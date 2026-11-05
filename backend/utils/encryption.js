const CryptoJS = require('crypto-js');

// Use encryption key from environment or fallback to a default (should be in production .env)
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'insuraflow-default-encryption-key-change-in-production';

/**
 * Encrypt text using AES encryption
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted ciphertext
 */
const encrypt = (text) => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(String(text), SECRET_KEY).toString();
};

/**
 * Decrypt ciphertext using AES decryption
 * @param {string} ciphertext - Encrypted text to decrypt
 * @returns {string} - Decrypted plain text
 */
const decrypt = (ciphertext) => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error.message);
    return '';
  }
};

module.exports = { encrypt, decrypt };

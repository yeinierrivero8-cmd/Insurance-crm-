const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const generateSecret = (email) => {
  return speakeasy.generateSecret({
    name: `InsuraFlow CRM (${email})`,
    issuer: 'InsuraFlow CRM',
    length: 32
  });
};

const verifyToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
};

const generateQRCode = async (secret) => {
  return QRCode.toDataURL(secret.otpauth_url);
};

module.exports = { generateSecret, verifyToken, generateQRCode };

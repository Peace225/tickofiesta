const QRCode = require('qrcode');
const crypto = require('crypto');

// Génère un hash unique pour le ticket
const generateTicketHash = (userId, ticketId, transactionRef) => {
  return crypto
    .createHash('sha256')
    .update(`${userId}-${ticketId}-${transactionRef}-${Date.now()}`)
    .digest('hex');
};

// Génère l'image QR Code en base64
const generateQRCodeImage = async (data) => {
  try {
    const qrImage = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });
    return qrImage;
  } catch (error) {
    throw new Error('Erreur génération QR Code : ' + error.message);
  }
};

module.exports = { generateTicketHash, generateQRCodeImage };

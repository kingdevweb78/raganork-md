// ========================================
// Victory Hub v2.0 - Konfigirasyon Bot la
// ========================================

module.exports = {
  // Non bot la
  BOT_NAME: process.env.BOT_NAME || "Victory Hub",

  // Prefiks kòmand yo (separe ak virgul si plizyè)
  HANDLERS: process.env.HANDLERS || ".,",

  // Mòd: "public" (tout moun) oswa "private" (admin sèlman)
  MODE: process.env.MODE || "public",

  // Lang
  LANGUAGE: process.env.LANGUAGE || "HT",

  // Pòt pou sèvè HTTP
  PORT: parseInt(process.env.PORT || "3000"),

  // API pou chatbot (GROQ)
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",

  // Nimewo WhatsApp pou pairing code (fòma entènasyonal, pa gen +)
  // Egzanp: 50956188480
  PAIRING_PHONE: process.env.PAIRING_PHONE || "",

  // Lis gwoup ki bloke (separe ak virgul)
  BLOCK_CHAT: process.env.BLOCK_CHAT || "",
};

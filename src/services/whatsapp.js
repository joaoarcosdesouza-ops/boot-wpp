const axios = require("axios");
const https = require("https");

const EVOLUTION_URL = "http://129.121.32.176";
const INSTANCE_NAME = "bendita-financeiro";
const API_KEY = "2AA41CA81E03-40AB-A81D-73BD6D47F272";

async function sendMessage(number, text) {
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`,
      {
        number,
        text
      },
      {
        
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
          }),

        headers: {
          apikey: API_KEY,
          "Content-Type": "application/json"
        }
    }
  );

    console.log("Mensagem enviada:", response.data);
  } catch (error) {
    console.log("Erro ao enviar mensagem:");
    console.log(error.response?.data || error.message);
  }
}

module.exports = {
  sendMessage
};
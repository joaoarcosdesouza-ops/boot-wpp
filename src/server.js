const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { sendMessage } = require("./services/whatsapp");
const { handleMessage } = require("./controllers/messageController");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bendita Finance Bot Online 🚀");
});

app.get("/teste", async (req, res) => {
  await sendMessage(
    "5511915000233",
    "🔥 TESTE DO BOT BENDITA FINANCE FUNCIONANDO!"
  );

  res.send("Mensagem enviada!");
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("WEBHOOK RECEBIDO:");
    console.log(JSON.stringify(req.body, null, 2));

    await handleMessage(req.body);

    res.status(200).send("OK");
  } catch (error) {
    console.log("Erro no webhook:", error);
    res.status(500).send("Erro");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

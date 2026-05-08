const { sendMessage } = require("../services/whatsapp");
const { registrarGasto } = require("../services/financialService");

function extrairMensagem(body) {
  const data = body?.data;

  if (!data || !data.message || !data.key) {
    return null;
  }

  const remoteJid = data.key.remoteJid || "";
  const number = remoteJid.split("@")[0];

  const text =
    data.message.conversation ||
    data.message.extendedTextMessage?.text ||
    "";

  return { number, text };
}

async function handleMessage(body) {
  const mensagem = extrairMensagem(body);

  if (!mensagem || !mensagem.number) {
    return;
  }

  const { number, text } = mensagem;
  const textoNormalizado = text.toLowerCase().trim();

  console.log("Número:", number);
  console.log("Texto:", text);

  if (textoNormalizado === "oi bot") {
    await sendMessage(number, "🤖 Olá! O Bendita Finance está online!");
    return;
  }

  if (textoNormalizado.startsWith("gasto ")) {
    const descricao = text.trim().slice(6).trim();

    try {
      const gasto = await registrarGasto(number, descricao);

      const valorFormatado =
        gasto && typeof gasto.valor === "number"
          ? gasto.valor.toFixed(2).replace(".", ",")
          : null;

      const mensagemConfirmacao = valorFormatado
        ? `✅ Gasto registrado: ${gasto.descricao || descricao} - R$ ${valorFormatado}`
        : `✅ Gasto registrado: ${descricao}`;

      await sendMessage(number, mensagemConfirmacao);
    } catch (error) {
      console.log("Erro ao registrar gasto:", error.message);
      await sendMessage(
        number,
        "❌ Não consegui registrar seu gasto. Tente novamente."
      );
    }
    return;
  }
}

module.exports = {
  extrairMensagem,
  handleMessage
};

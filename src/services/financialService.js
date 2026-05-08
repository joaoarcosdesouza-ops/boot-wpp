const axios = require("axios");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

async function registrarGasto(numero, descricao, valor = 0) {
  try {
    const response = await axios.post(
      `${SUPABASE_URL}/rest/v1/financeiro_lancamentos`,
      {
        tipo: "saida",
        descricao,
        categoria: descricao,
        valor,
        data: new Date().toISOString().split("T")[0],
        forma_pagamento: "pix",
        observacao: `Lançado via WhatsApp (${numero})`,
        status: "pago"
      },
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        }
      }
    );

    console.log("Gasto registrado:", response.data);

    return {
      sucesso: true
    };
  } catch (error) {
    console.log(
      "Erro ao registrar gasto:",
      error.response?.data || error.message
    );

    return {
      sucesso: false
    };
  }
}

module.exports = {
  registrarGasto
};
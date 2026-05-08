const axios = require("axios");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CATEGORIAS = {
  mercado: ["mercado", "supermercado", "feira", "hortifruti", "açougue", "padaria"],
  alimentação: ["restaurante", "lanche", "ifood", "comida", "almoço", "jantar", "café", "pizza", "hamburguer", "hambúrguer"],
  transporte: ["uber", "99", "taxi", "táxi", "gasolina", "combustível", "combustivel", "posto", "etanol", "ônibus", "onibus", "metrô", "metro"],
  farmácia: ["farmácia", "farmacia", "remédio", "remedio", "medicamento", "drogaria"],
  contas: ["luz", "energia", "água", "agua", "internet", "telefone", "celular", "conta", "boleto"],
  moradia: ["aluguel", "condomínio", "condominio", "iptu"],
  vestuário: ["roupa", "calçado", "calcado", "tênis", "tenis", "sapato", "camisa"],
  lazer: ["cinema", "show", "viagem", "parque", "bar", "balada"],
  saúde: ["médico", "medico", "consulta", "exame", "dentista", "plano"],
  educação: ["escola", "faculdade", "curso", "livro", "material"]
};

function inferirCategoria(descricao) {
  if (!descricao) return "outros";

  const texto = descricao
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [categoria, palavras] of Object.entries(CATEGORIAS)) {
    for (const palavra of palavras) {
      const palavraNorm = palavra
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const regex = new RegExp(`\\b${palavraNorm}\\b`);
      if (regex.test(texto)) {
        return categoria;
      }
    }
  }

  return descricao.trim().split(/\s+/)[0].toLowerCase();
}

function parseGasto(descricaoBruta) {
  if (!descricaoBruta || typeof descricaoBruta !== "string") {
    return { valor: null, descricao: "" };
  }

  const limpo = descricaoBruta.replace(/r\$\s*/gi, "").trim();

  const match = limpo.match(/(\d+(?:[.,]\d{1,2})?)/);

  if (!match) {
    return { valor: null, descricao: limpo };
  }

  const valorStr = match[1].replace(",", ".");
  const valor = parseFloat(valorStr);

  const descricao = (
    limpo.slice(0, match.index) + limpo.slice(match.index + match[0].length)
  )
    .replace(/\s+/g, " ")
    .trim();

  return {
    valor: Number.isFinite(valor) ? valor : null,
    descricao
  };
}

function dataAtual() {
  return new Date().toISOString().split("T")[0];
}

async function registrarGasto(number, descricaoBruta) {
  const { valor, descricao } = parseGasto(descricaoBruta);

  if (valor === null) {
    throw new Error("Não foi possível identificar um valor no gasto informado.");
  }

  const descricaoFinal = descricao || "Gasto";
  const categoria = inferirCategoria(descricaoFinal);

  const lancamento = {
    tipo: "saida",
    descricao: descricaoFinal,
    categoria,
    valor,
    data: dataAtual(),
    forma_pagamento: "pix",
    observacao: `Lançado via WhatsApp (${number})`,
    status: "pago"
  };

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log("[financialService] Lançamento (não persistido):", lancamento);
    return lancamento;
  }

  try {
    const response = await axios.post(
      `${SUPABASE_URL}/rest/v1/financeiro_lancamentos`,
      lancamento,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        }
      }
    );

    if (Array.isArray(response.data)) {
      return response.data[0] || lancamento;
    }

    return response.data || lancamento;
  } catch (error) {
    console.log(
      "[financialService] Erro ao salvar em financeiro_lancamentos:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = {
  registrarGasto,
  parseGasto,
  inferirCategoria
};

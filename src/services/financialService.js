const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.warn(
    "[financialService] SUPABASE_URL/SUPABASE_KEY não configurados — lançamentos não serão persistidos."
  );
}

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

  if (!supabase) {
    console.log("[financialService] Lançamento (não persistido):", lancamento);
    return lancamento;
  }

  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .insert(lancamento)
    .select()
    .single();

  if (error) {
    console.log(
      "[financialService] Erro ao salvar em financeiro_lancamentos:",
      error.message
    );
    throw error;
  }

  return data || lancamento;
}

module.exports = {
  registrarGasto,
  parseGasto,
  inferirCategoria
};

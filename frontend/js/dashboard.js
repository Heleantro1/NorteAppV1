verificarLogin();

document.addEventListener("DOMContentLoaded", () => {
  carregarResumoFinanceiro();
  carregarGraficoCategorias();
  carregarHistoricoMensalDashboard();
});

let grafico;
let graficoCategorias;
let graficoHistoricoMensalDashboard;

async function carregarResumoFinanceiro() {
  const mensagem = document.getElementById("dashboardMensagem");

  try {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    document.getElementById("mesAtual").textContent = `${String(mes).padStart(2, "0")}/${ano}`;

    const resposta = await fetch(`${API_BASE}/relatorios/resumo-mensal?mes=${mes}&ano=${ano}`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível carregar o resumo financeiro.";
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    const receitas = Number(dados.total_receitas ?? dados.receitas ?? 0);
    const despesas = Number(dados.total_despesas ?? dados.despesas ?? 0);
    const saldo = Number(dados.saldo ?? (receitas - despesas));

    document.getElementById("saldoAtual").textContent = formatarMoeda(saldo);
    document.getElementById("totalReceitas").textContent = formatarMoeda(receitas);
    document.getElementById("totalDespesas").textContent = formatarMoeda(despesas);

    document.getElementById("resumoReceitas").textContent = formatarMoeda(receitas);
    document.getElementById("resumoDespesas").textContent = formatarMoeda(despesas);
    document.getElementById("resumoSaldo").textContent = formatarMoeda(saldo);

    document.getElementById("statusFinanceiro").textContent = saldo >= 0 ? "Saudável" : "Em alerta";

    criarGrafico(receitas, despesas);

  } catch (error) {
    mensagem.textContent = "Erro de conexão com a API ao carregar o dashboard.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão ao carregar o dashboard.", "error");
  }
}

function criarGrafico(receitas, despesas) {
  const canvas = document.getElementById("graficoFinanceiro");
  const ctx = canvas.getContext("2d");

  if (grafico) {
    grafico.destroy();
  }

  grafico = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [
        {
          data: [receitas, despesas]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

async function carregarGraficoCategorias() {
  const mensagem = document.getElementById("dashboardMensagem");

  try {
    const resposta = await fetch(`${API_BASE}/transacoes/`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível carregar as categorias.";
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    if (!Array.isArray(dados)) {
      mensagem.textContent = "Formato inesperado ao carregar transações.";
      mensagem.className = "feedback-box error";
      mostrarToast("Formato inesperado ao carregar transações.", "error");
      return;
    }

    const categoriasMap = {};

    dados.forEach(transacao => {
      const tipo = transacao.tipo ?? transacao.tipo_transacao ?? "";
      const categoria = transacao.categoria ?? "Sem categoria";
      const valor = Number(transacao.valor ?? 0);

      if (tipo !== "despesa") return;

      categoriasMap[categoria] = (categoriasMap[categoria] || 0) + valor;
    });

    const labels = Object.keys(categoriasMap);
    const valores = Object.values(categoriasMap);

    if (!labels.length) {
      if (graficoCategorias) {
        graficoCategorias.destroy();
      }
      return;
    }

    criarGraficoCategorias(labels, valores);

  } catch (error) {
    mensagem.textContent = "Erro de conexão ao carregar gráfico por categoria.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão ao carregar gráfico por categoria.", "error");
  }
}

function criarGraficoCategorias(labels, valores) {
  const canvas = document.getElementById("graficoCategorias");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (graficoCategorias) {
    graficoCategorias.destroy();
  }

  graficoCategorias = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: valores
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

async function carregarHistoricoMensalDashboard() {
  const mensagem = document.getElementById("dashboardMensagem");

  try {
    const ano = new Date().getFullYear();

    const resposta = await fetch(`${API_BASE}/relatorios/historico?ano=${ano}`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível carregar o histórico mensal.";
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    const labels = dados.map(item => nomeMes(item.mes));
    const receitas = dados.map(item => Number(item.receitas || 0));
    const despesas = dados.map(item => Number(item.despesas || 0));
    const saldo = dados.map(item => Number(item.saldo || 0));

    criarGraficoHistoricoMensalDashboard(labels, receitas, despesas, saldo);

  } catch (error) {
    mensagem.textContent = "Erro de conexão ao carregar histórico mensal.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão ao carregar histórico mensal.", "error");
  }
}

function criarGraficoHistoricoMensalDashboard(labels, receitas, despesas, saldo) {
  const canvas = document.getElementById("graficoHistoricoMensal");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (graficoHistoricoMensalDashboard) {
    graficoHistoricoMensalDashboard.destroy();
  }

  graficoHistoricoMensalDashboard = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Receitas", data: receitas },
        { label: "Despesas", data: despesas },
        { label: "Saldo", data: saldo }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });
}

function nomeMes(numero) {
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];
  return meses[numero - 1] || String(numero);
}
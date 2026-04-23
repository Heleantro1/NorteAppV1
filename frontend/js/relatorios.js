verificarLogin();

let graficoHistoricoMensal;
let ultimoResumo = null;
let ultimosAlertas = [];
let ultimoPeriodo = "";

document.addEventListener("DOMContentLoaded", () => {
  preencherMesAnoAtual();
  carregarRelatorio();

  document.getElementById("filtroRelatorioForm").addEventListener("submit", (event) => {
    event.preventDefault();
    carregarRelatorio();
  });
});

function preencherMesAnoAtual() {
  const hoje = new Date();
  document.getElementById("mes").value = hoje.getMonth() + 1;
  document.getElementById("ano").value = hoje.getFullYear();
}

async function carregarRelatorio() {
  const mensagem = document.getElementById("relatorioMensagem");
  const mes = parseInt(document.getElementById("mes").value, 10);
  const ano = parseInt(document.getElementById("ano").value, 10);

  ultimoPeriodo = `${String(mes).padStart(2, "0")}/${ano}`;
  document.getElementById("periodoSelecionado").textContent = ultimoPeriodo;

  await Promise.all([
    carregarResumo(mes, ano, mensagem),
    carregarAlertas(mes, ano, mensagem),
    carregarHistoricoMensal(ano, mensagem)
  ]);
}

async function carregarResumo(mes, ano, mensagem) {
  try {
    const resposta = await fetch(`${API_BASE}/relatorios/resumo-mensal?mes=${mes}&ano=${ano}`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível carregar o resumo do relatório.";
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    const receitas = Number(dados.total_receitas ?? dados.receitas ?? 0);
    const despesas = Number(dados.total_despesas ?? dados.despesas ?? 0);
    const saldo = Number(dados.saldo ?? (receitas - despesas));

    ultimoResumo = { receitas, despesas, saldo };

    document.getElementById("saldoPeriodo").textContent = formatarMoeda(saldo);
    document.getElementById("receitasPeriodo").textContent = formatarMoeda(receitas);
    document.getElementById("despesasPeriodo").textContent = formatarMoeda(despesas);

    document.getElementById("resumoReceitas").textContent = formatarMoeda(receitas);
    document.getElementById("resumoDespesas").textContent = formatarMoeda(despesas);
    document.getElementById("resumoSaldo").textContent = formatarMoeda(saldo);

    document.getElementById("statusPeriodo").textContent = saldo >= 0 ? "Positivo" : "Negativo";

  } catch (error) {
    mensagem.textContent = "Erro de conexão com a API ao carregar o resumo.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao carregar o resumo.", "error");
  }
}

async function carregarAlertas(mes, ano, mensagem) {
  const lista = document.getElementById("listaAlertas");

  lista.innerHTML = `<p class="relatorio-empty">Carregando alertas...</p>`;

  try {
    const resposta = await fetch(`${API_BASE}/relatorios/alertas?mes=${mes}&ano=${ano}`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível carregar os alertas.";
      lista.innerHTML = `<p class="relatorio-empty">Erro ao carregar alertas.</p>`;
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    ultimosAlertas = Array.isArray(dados) ? dados : [];

    if (!Array.isArray(dados) || !dados.length) {
      lista.innerHTML = `<p class="relatorio-empty">Nenhum alerta para este período.</p>`;
      return;
    }

    lista.innerHTML = dados.map(alerta => {
      const categoria = alerta.categoria ?? "Categoria";
      const limite = Number(alerta.limite ?? alerta.valor_limite ?? 0);
      const gasto = Number(alerta.gasto ?? alerta.gasto_atual ?? 0);
      const percentual = limite > 0 ? (gasto / limite) * 100 : 0;

      let classe = "ok";
      let titulo = "Dentro do orçamento";

      if (percentual >= 100) {
        classe = "estourado";
        titulo = "Orçamento estourado";
      } else if (percentual >= 80) {
        classe = "";
        titulo = "Perto do limite";
      }

      return `
        <div class="alerta-item ${classe}">
          <h4>${titulo} - ${categoria}</h4>
          <p><strong>Limite:</strong> ${formatarMoeda(limite)}</p>
          <p><strong>Gasto:</strong> ${formatarMoeda(gasto)}</p>
          <p><strong>Consumo:</strong> ${percentual.toFixed(1)}%</p>
        </div>
      `;
    }).join("");

  } catch (error) {
    lista.innerHTML = `<p class="relatorio-empty">Erro de conexão com a API.</p>`;
    mensagem.textContent = "Erro de conexão com a API ao carregar os alertas.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao carregar os alertas.", "error");
  }
}

async function carregarHistoricoMensal(ano, mensagem) {
  try {
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

    criarGraficoHistoricoMensal(labels, receitas, despesas, saldo);

  } catch (error) {
    mensagem.textContent = "Erro de conexão com a API ao carregar o histórico mensal.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao carregar o histórico mensal.", "error");
  }
}

function criarGraficoHistoricoMensal(labels, receitas, despesas, saldo) {
  const canvas = document.getElementById("graficoHistoricoMensal");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (graficoHistoricoMensal) {
    graficoHistoricoMensal.destroy();
  }

  graficoHistoricoMensal = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
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

function exportarCSV() {
  if (!ultimoResumo) {
    mostrarToast("Gere um relatório antes de exportar.", "info");
    return;
  }

  const linhas = [
    ["Período", ultimoPeriodo],
    ["Receitas", ultimoResumo.receitas],
    ["Despesas", ultimoResumo.despesas],
    ["Saldo", ultimoResumo.saldo],
    [""],
    ["Alertas"]
  ];

  if (ultimosAlertas.length) {
    ultimosAlertas.forEach(alerta => {
      linhas.push([
        alerta.categoria ?? "Categoria",
        alerta.limite ?? 0,
        alerta.gasto ?? alerta.gasto_atual ?? 0
      ]);
    });
  } else {
    linhas.push(["Nenhum alerta no período"]);
  }

  const csv = linhas.map(linha => linha.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio_${ultimoPeriodo.replace("/", "_")}.csv`;
  link.click();

  URL.revokeObjectURL(url);
  mostrarToast("CSV exportado com sucesso.", "success");
}

function exportarPDF() {
  if (!ultimoResumo) {
    mostrarToast("Gere um relatório antes de exportar.", "info");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(16);
  doc.text("Relatório Financeiro - Norte Financeiro IA", 14, y);
  y += 12;

  doc.setFontSize(12);
  doc.text(`Período: ${ultimoPeriodo}`, 14, y);
  y += 10;

  doc.text(`Receitas: ${formatarMoeda(ultimoResumo.receitas)}`, 14, y);
  y += 8;

  doc.text(`Despesas: ${formatarMoeda(ultimoResumo.despesas)}`, 14, y);
  y += 8;

  doc.text(`Saldo: ${formatarMoeda(ultimoResumo.saldo)}`, 14, y);
  y += 14;

  doc.setFontSize(13);
  doc.text("Alertas", 14, y);
  y += 10;

  doc.setFontSize(11);

  if (ultimosAlertas.length) {
    ultimosAlertas.forEach((alerta) => {
      const categoria = alerta.categoria ?? "Categoria";
      const limite = formatarMoeda(alerta.limite ?? 0);
      const gasto = formatarMoeda(alerta.gasto ?? alerta.gasto_atual ?? 0);

      doc.text(`- ${categoria} | Limite: ${limite} | Gasto: ${gasto}`, 14, y);
      y += 8;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  } else {
    doc.text("Nenhum alerta no período.", 14, y);
  }

  doc.save(`relatorio_${ultimoPeriodo.replace("/", "_")}.pdf`);
  mostrarToast("PDF exportado com sucesso.", "success");
}
verificarLogin();

document.addEventListener("DOMContentLoaded", () => {
  preencherMesAnoAtual();

  document.getElementById("insightsForm").addEventListener("submit", gerarInsights);
});

function preencherMesAnoAtual() {
  const hoje = new Date();
  document.getElementById("mes").value = hoje.getMonth() + 1;
  document.getElementById("ano").value = hoje.getFullYear();
}

function usarPergunta(texto) {
  document.getElementById("pergunta").value = texto;
  mostrarToast("Pergunta preenchida.", "info");
}

function limparResposta() {
  document.getElementById("insightResultado").innerHTML = `
    <p class="insight-placeholder">A análise da IA aparecerá aqui.</p>
  `;
  mostrarToast("Resposta limpa.", "info");
}

async function gerarInsights(event) {
  event.preventDefault();

  const mensagemFeedback = document.getElementById("insightMensagem");
  const resultado = document.getElementById("insightResultado");

  const mes = parseInt(document.getElementById("mes").value, 10);
  const ano = parseInt(document.getElementById("ano").value, 10);
  const pergunta = document.getElementById("pergunta").value.trim() || "Analise meu período financeiro e traga insights práticos.";

  resultado.innerHTML = `<p class="insight-loading">Gerando análise com IA...</p>`;
  mensagemFeedback.className = "feedback-box";
  mensagemFeedback.textContent = "";

  const payload = {
    mensagem: pergunta,
    mes,
    ano
  };

  try {
    const resposta = await fetch(`${API_BASE}/ia/analisar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || dados.mensagem || "Não foi possível gerar os insights.";
      resultado.innerHTML = `<p class="insight-error">${erro}</p>`;
      mensagemFeedback.textContent = erro;
      mensagemFeedback.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    const resumo = dados.resumo || "Sem resumo disponível.";
    const score = dados.score?.score ?? "-";
    const nivel = dados.score?.nivel ?? "-";
    const descricao = dados.score?.descricao ?? "";
    const alertas = Array.isArray(dados.alertas) ? dados.alertas : [];
    const insights = Array.isArray(dados.insights) ? dados.insights : [];
    const recomendacoes = Array.isArray(dados.recomendacoes) ? dados.recomendacoes : [];

    resultado.innerHTML = `
      <div class="insight-section">
        <h4>Resumo</h4>
        <p>${resumo}</p>
      </div>

      <div class="insight-section">
        <h4>Score Financeiro</h4>
        <p><strong>Pontuação:</strong> ${score}</p>
        <p><strong>Nível:</strong> ${nivel}</p>
        <p>${descricao}</p>
      </div>

      <div class="insight-section">
        <h4>Alertas</h4>
        ${
          alertas.length
            ? `<ul>${alertas.map(item => `<li>${item}</li>`).join("")}</ul>`
            : `<p>Nenhum alerta encontrado.</p>`
        }
      </div>

      <div class="insight-section">
        <h4>Insights</h4>
        ${
          insights.length
            ? `<ul>${insights.map(item => `<li>${item}</li>`).join("")}</ul>`
            : `<p>Nenhum insight disponível.</p>`
        }
      </div>

      <div class="insight-section">
        <h4>Recomendações</h4>
        ${
          recomendacoes.length
            ? `<ul>${recomendacoes.map(item => `<li>${item}</li>`).join("")}</ul>`
            : `<p>Nenhuma recomendação disponível.</p>`
        }
      </div>
    `;

    mensagemFeedback.textContent = "Insights gerados com sucesso.";
    mensagemFeedback.className = "feedback-box success";
    mostrarToast("Insights gerados com sucesso.", "success");

  } catch (error) {
    resultado.innerHTML = `<p class="insight-error">Erro de conexão com a API ao gerar insights.</p>`;
    mensagemFeedback.textContent = "Erro de conexão com a API ao gerar insights.";
    mensagemFeedback.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao gerar insights.", "error");
  }
}
verificarLogin();

document.addEventListener("DOMContentLoaded", () => {
  preencherMesAnoAtual();
  carregarOrcamentos();

  document.getElementById("orcamentoForm").addEventListener("submit", salvarOuAtualizarOrcamento);
});

function preencherMesAnoAtual() {
  const hoje = new Date();
  document.getElementById("mes").value = hoje.getMonth() + 1;
  document.getElementById("ano").value = hoje.getFullYear();
}

async function salvarOuAtualizarOrcamento(event) {
  event.preventDefault();

  const mensagem = document.getElementById("orcamentoMensagem");
  const orcamentoId = document.getElementById("orcamentoId").value;

  const categoria = document.getElementById("categoria").value.trim();
  const limite = parseFloat(document.getElementById("limite").value);
  const mes = parseInt(document.getElementById("mes").value, 10);
  const ano = parseInt(document.getElementById("ano").value, 10);

  const payload = {
    categoria,
    limite,
    mes,
    ano
  };

  const editando = Boolean(orcamentoId);
  const url = editando ? `${API_BASE}/orcamentos/${orcamentoId}` : `${API_BASE}/orcamentos/`;
  const method = editando ? "PUT" : "POST";

  try {
    const resposta = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível salvar o orçamento.";
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    mensagem.textContent = editando
      ? "Orçamento atualizado com sucesso."
      : "Orçamento salvo com sucesso.";
    mensagem.className = "feedback-box success";

    mostrarToast(
      editando ? "Orçamento atualizado com sucesso." : "Orçamento salvo com sucesso.",
      "success"
    );

    limparFormularioOrcamento();
    carregarOrcamentos();

  } catch (error) {
    mensagem.textContent = "Erro de conexão com a API ao salvar o orçamento.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao salvar o orçamento.", "error");
  }
}

async function carregarOrcamentos() {
  const lista = document.getElementById("listaOrcamentos");
  const mensagem = document.getElementById("orcamentoMensagem");

  lista.innerHTML = "<p>Carregando orçamentos...</p>";

  try {
    const resposta = await fetch(`${API_BASE}/orcamentos/`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível carregar os orçamentos.";
      lista.innerHTML = `<p class="orcamento-empty">Erro ao carregar orçamentos.</p>`;
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    if (!dados.length) {
      lista.innerHTML = `<p class="orcamento-empty">Nenhum orçamento cadastrado ainda.</p>`;
      return;
    }

    lista.innerHTML = dados.map(orcamento => {
      const categoria = orcamento.categoria ?? "Categoria";
      const limite = Number(orcamento.limite ?? 0);
      const gasto = Number(orcamento.gasto_atual ?? orcamento.gasto ?? 0);
      const mes = orcamento.mes ?? "--";
      const ano = orcamento.ano ?? "--";

      const percentual = limite > 0 ? (gasto / limite) * 100 : 0;
      const restante = limite - gasto;

      let statusClasse = "status-ok";
      let statusTexto = "Dentro do orçamento";

      if (percentual >= 100) {
        statusClasse = "status-estourado";
        statusTexto = "Orçamento estourado";
      } else if (percentual >= 80) {
        statusClasse = "status-alerta";
        statusTexto = "Perto do limite";
      }

      return `
        <div class="orcamento-card">
          <h4>${categoria}</h4>
          <p><strong>Limite:</strong> ${formatarMoeda(limite)}</p>
          <p><strong>Gasto atual:</strong> ${formatarMoeda(gasto)}</p>
          <p><strong>Restante:</strong> ${formatarMoeda(restante)}</p>
          <p><strong>Período:</strong> ${String(mes).padStart(2, "0")}/${ano}</p>

          <div class="progress-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(percentual, 100)}%"></div>
            </div>
            <div class="progress-text">${percentual.toFixed(1)}% utilizado</div>
          </div>

          <span class="status-tag ${statusClasse}">${statusTexto}</span>

          <div class="action-buttons" style="margin-top: 14px;">
            <button class="secondary-btn btn-small" onclick="editarOrcamento(${orcamento.id}, '${escapeJs(categoria)}', ${limite}, ${mes}, ${ano})">
              Editar
            </button>
            <button class="danger-btn btn-small" onclick="excluirOrcamento(${orcamento.id})">
              Excluir
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    lista.innerHTML = `<p class="orcamento-empty">Erro de conexão com a API.</p>`;
    mensagem.textContent = "Erro de conexão com a API ao carregar os orçamentos.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao carregar os orçamentos.", "error");
  }
}

function editarOrcamento(id, categoria, limite, mes, ano) {
  document.getElementById("orcamentoId").value = id;
  document.getElementById("categoria").value = categoria;
  document.getElementById("limite").value = limite;
  document.getElementById("mes").value = mes;
  document.getElementById("ano").value = ano;

  document.getElementById("tituloFormularioOrcamento").textContent = "Editar Orçamento";
  document.getElementById("btnSalvarOrcamento").textContent = "Atualizar Orçamento";
  document.getElementById("btnCancelarEdicaoOrcamento").style.display = "inline-block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  mostrarToast("Modo de edição do orçamento ativado.", "info");
}

function cancelarEdicaoOrcamento() {
  limparFormularioOrcamento();
  mostrarToast("Edição do orçamento cancelada.", "info");
}

function limparFormularioOrcamento() {
  document.getElementById("orcamentoForm").reset();
  document.getElementById("orcamentoId").value = "";
  document.getElementById("tituloFormularioOrcamento").textContent = "Novo Orçamento";
  document.getElementById("btnSalvarOrcamento").textContent = "Salvar Orçamento";
  document.getElementById("btnCancelarEdicaoOrcamento").style.display = "none";
  preencherMesAnoAtual();
}

function excluirOrcamento(id) {
  abrirModalConfirmacao({
    titulo: "Excluir orçamento",
    mensagem: "Tem certeza que deseja excluir este orçamento?",
    onConfirm: async () => {
      const mensagem = document.getElementById("orcamentoMensagem");

      try {
        const resposta = await fetch(`${API_BASE}/orcamentos/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          const erro = dados.detail || "Não foi possível excluir o orçamento.";
          mensagem.textContent = erro;
          mensagem.className = "feedback-box error";
          mostrarToast(erro, "error");
          return;
        }

        mensagem.textContent = "Orçamento excluído com sucesso.";
        mensagem.className = "feedback-box success";

        mostrarToast("Orçamento excluído com sucesso.", "success");
        limparFormularioOrcamento();
        carregarOrcamentos();

      } catch (error) {
        mensagem.textContent = "Erro de conexão com a API ao excluir o orçamento.";
        mensagem.className = "feedback-box error";
        mostrarToast("Erro de conexão com a API ao excluir o orçamento.", "error");
      }
    }
  });
}

function escapeJs(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}
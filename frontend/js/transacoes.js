verificarLogin();

document.addEventListener("DOMContentLoaded", () => {
  definirDataAtual();
  carregarTransacoes();

  document.getElementById("transacaoForm").addEventListener("submit", salvarOuAtualizarTransacao);
});

function definirDataAtual() {
  const hoje = new Date().toISOString().split("T")[0];
  document.getElementById("data").value = hoje;
}

async function salvarOuAtualizarTransacao(event) {
  event.preventDefault();

  const mensagem = document.getElementById("transacaoMensagem");
  const transacaoId = document.getElementById("transacaoId").value;

  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const tipo = document.getElementById("tipo").value;
  const categoria = document.getElementById("categoria").value.trim();
  const data = document.getElementById("data").value;

  const payload = {
    descricao,
    valor,
    tipo,
    categoria,
    data
  };

  const editando = Boolean(transacaoId);
  const url = editando ? `${API_BASE}/transacoes/${transacaoId}` : `${API_BASE}/transacoes/`;
  const method = editando ? "PUT" : "POST";

  try {
    const resposta = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível salvar a transação.";
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    mensagem.textContent = editando
      ? "Transação atualizada com sucesso."
      : "Transação salva com sucesso.";
    mensagem.className = "feedback-box success";

    mostrarToast(
      editando ? "Transação atualizada com sucesso." : "Transação salva com sucesso.",
      "success"
    );

    limparFormulario();
    carregarTransacoes();

  } catch (error) {
    mensagem.textContent = "Erro de conexão com a API ao salvar a transação.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao salvar a transação.", "error");
  }
}

async function carregarTransacoes() {
  const tabela = document.getElementById("tabelaTransacoes");
  const mensagem = document.getElementById("transacaoMensagem");

  tabela.innerHTML = `
    <tr>
      <td colspan="6" class="empty-state">Carregando transações...</td>
    </tr>
  `;

  try {
    const resposta = await fetch(`${API_BASE}/transacoes/`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      tabela.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">Erro ao carregar transações.</td>
        </tr>
      `;

      const erro = dados.detail || "Não foi possível carregar as transações.";
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    if (!dados.length) {
      tabela.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">Nenhuma transação cadastrada ainda.</td>
        </tr>
      `;
      return;
    }

    tabela.innerHTML = dados.map(transacao => {
      const ehReceita = transacao.tipo === "receita";
      const badgeClass = ehReceita ? "badge badge-receita" : "badge badge-despesa";
      const valorClass = ehReceita ? "valor-receita" : "valor-despesa";
      const sinal = ehReceita ? "+" : "-";

      return `
        <tr>
          <td>${transacao.descricao ?? "-"}</td>
          <td>${transacao.categoria ?? "-"}</td>
          <td><span class="${badgeClass}">${transacao.tipo ?? "-"}</span></td>
          <td class="${valorClass}">${sinal} ${formatarMoeda(transacao.valor)}</td>
          <td>${formatarData(transacao.data)}</td>
          <td>
            <div class="action-buttons">
              <button class="secondary-btn btn-small" onclick="editarTransacao(${transacao.id}, '${escapeJs(transacao.descricao)}', ${transacao.valor}, '${escapeJs(transacao.tipo)}', '${escapeJs(transacao.categoria)}', '${formatarDataInput(transacao.data)}')">
                Editar
              </button>
              <button class="danger-btn btn-small" onclick="excluirTransacao(${transacao.id})">
                Excluir
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    tabela.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Erro de conexão com a API.</td>
      </tr>
    `;

    mensagem.textContent = "Erro de conexão com a API ao carregar transações.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao carregar transações.", "error");
  }
}

function editarTransacao(id, descricao, valor, tipo, categoria, data) {
  document.getElementById("transacaoId").value = id;
  document.getElementById("descricao").value = descricao;
  document.getElementById("valor").value = valor;
  document.getElementById("tipo").value = tipo;
  document.getElementById("categoria").value = categoria;
  document.getElementById("data").value = data;

  document.getElementById("tituloFormulario").textContent = "Editar Transação";
  document.getElementById("btnSalvarTransacao").textContent = "Atualizar Transação";
  document.getElementById("btnCancelarEdicao").style.display = "inline-block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  mostrarToast("Modo de edição ativado.", "info");
}

function cancelarEdicao() {
  limparFormulario();
  mostrarToast("Edição cancelada.", "info");
}

function limparFormulario() {
  document.getElementById("transacaoForm").reset();
  document.getElementById("transacaoId").value = "";
  document.getElementById("tituloFormulario").textContent = "Nova Transação";
  document.getElementById("btnSalvarTransacao").textContent = "Salvar Transação";
  document.getElementById("btnCancelarEdicao").style.display = "none";
  definirDataAtual();
}

function excluirTransacao(id) {
  abrirModalConfirmacao({
    titulo: "Excluir transação",
    mensagem: "Tem certeza que deseja excluir esta transação?",
    onConfirm: async () => {
      const mensagem = document.getElementById("transacaoMensagem");

      try {
        const resposta = await fetch(`${API_BASE}/transacoes/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          const erro = dados.detail || "Não foi possível excluir a transação.";
          mensagem.textContent = erro;
          mensagem.className = "feedback-box error";
          mostrarToast(erro, "error");
          return;
        }

        mensagem.textContent = "Transação excluída com sucesso.";
        mensagem.className = "feedback-box success";

        mostrarToast("Transação excluída com sucesso.", "success");
        limparFormulario();
        carregarTransacoes();

      } catch (error) {
        mensagem.textContent = "Erro de conexão com a API ao excluir a transação.";
        mensagem.className = "feedback-box error";
        mostrarToast("Erro de conexão com a API ao excluir a transação.", "error");
      }
    }
  });
}

function formatarData(data) {
  if (!data) return "-";

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return data;
  }

  return dataObj.toLocaleDateString("pt-BR");
}

function formatarDataInput(data) {
  if (!data) return "";

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return "";
  }

  return dataObj.toISOString().split("T")[0];
}

function escapeJs(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}
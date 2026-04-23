verificarLogin();

document.addEventListener("DOMContentLoaded", () => {
  carregarMetas();

  document.getElementById("metaForm").addEventListener("submit", salvarOuAtualizarMeta);
});

async function salvarOuAtualizarMeta(event) {
  event.preventDefault();

  const mensagem = document.getElementById("metaMensagem");
  const metaId = document.getElementById("metaId").value;

  const titulo = document.getElementById("titulo").value.trim();
  const valor_meta = parseFloat(document.getElementById("valorMeta").value);
  const valor_atual = parseFloat(document.getElementById("valorAtual").value);
  const prazo = document.getElementById("prazo").value;

  const payload = {
    titulo,
    valor_meta,
    valor_atual,
    prazo
  };

  const editando = Boolean(metaId);
  const url = editando ? `${API_BASE}/metas/${metaId}` : `${API_BASE}/metas/`;
  const method = editando ? "PUT" : "POST";

  try {
    const resposta = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível salvar a meta.";
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    mensagem.textContent = editando
      ? "Meta atualizada com sucesso."
      : "Meta salva com sucesso.";
    mensagem.className = "feedback-box success";

    mostrarToast(
      editando ? "Meta atualizada com sucesso." : "Meta salva com sucesso.",
      "success"
    );

    limparFormularioMeta();
    carregarMetas();

  } catch (error) {
    mensagem.textContent = "Erro de conexão com a API ao salvar a meta.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao salvar a meta.", "error");
  }
}

async function carregarMetas() {
  const lista = document.getElementById("listaMetas");
  const mensagem = document.getElementById("metaMensagem");

  lista.innerHTML = "<p>Carregando metas...</p>";

  try {
    const resposta = await fetch(`${API_BASE}/metas/`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = dados.detail || "Não foi possível carregar as metas.";
      lista.innerHTML = `<p class="meta-empty">Erro ao carregar metas.</p>`;
      mensagem.textContent = erro;
      mensagem.className = "feedback-box error";
      mostrarToast(erro, "error");
      return;
    }

    if (!dados.length) {
      lista.innerHTML = `<p class="meta-empty">Nenhuma meta cadastrada ainda.</p>`;
      return;
    }

    lista.innerHTML = dados.map(meta => {
      const titulo = meta.titulo ?? "Meta";
      const valorMeta = Number(meta.valor_meta ?? 0);
      const valorAtual = Number(meta.valor_atual ?? 0);
      const prazo = meta.prazo ?? "-";

      const percentual = valorMeta > 0
        ? Math.min((valorAtual / valorMeta) * 100, 100)
        : 0;

      const faltante = Math.max(valorMeta - valorAtual, 0);

      return `
        <div class="meta-card">
          <h4>${titulo}</h4>
          <p><strong>Objetivo:</strong> ${formatarMoeda(valorMeta)}</p>
          <p><strong>Atual:</strong> ${formatarMoeda(valorAtual)}</p>
          <p><strong>Falta:</strong> ${formatarMoeda(faltante)}</p>
          <p><strong>Prazo:</strong> ${formatarData(prazo)}</p>

          <div class="progress-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percentual}%"></div>
            </div>
            <div class="progress-text">${percentual.toFixed(1)}% concluído</div>
          </div>

          <div class="action-buttons" style="margin-top: 14px;">
            <button class="secondary-btn btn-small" onclick="editarMeta(${meta.id}, '${escapeJs(titulo)}', ${valorMeta}, ${valorAtual}, '${formatarDataInput(prazo)}')">
              Editar
            </button>
            <button class="danger-btn btn-small" onclick="excluirMeta(${meta.id})">
              Excluir
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    lista.innerHTML = `<p class="meta-empty">Erro de conexão com a API.</p>`;
    mensagem.textContent = "Erro de conexão com a API ao carregar as metas.";
    mensagem.className = "feedback-box error";
    mostrarToast("Erro de conexão com a API ao carregar as metas.", "error");
  }
}

function editarMeta(id, titulo, valorMeta, valorAtual, prazo) {
  document.getElementById("metaId").value = id;
  document.getElementById("titulo").value = titulo;
  document.getElementById("valorMeta").value = valorMeta;
  document.getElementById("valorAtual").value = valorAtual;
  document.getElementById("prazo").value = prazo;

  document.getElementById("tituloFormularioMeta").textContent = "Editar Meta";
  document.getElementById("btnSalvarMeta").textContent = "Atualizar Meta";
  document.getElementById("btnCancelarEdicaoMeta").style.display = "inline-block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  mostrarToast("Modo de edição da meta ativado.", "info");
}

function cancelarEdicaoMeta() {
  limparFormularioMeta();
  mostrarToast("Edição da meta cancelada.", "info");
}

function limparFormularioMeta() {
  document.getElementById("metaForm").reset();
  document.getElementById("metaId").value = "";
  document.getElementById("tituloFormularioMeta").textContent = "Nova Meta";
  document.getElementById("btnSalvarMeta").textContent = "Salvar Meta";
  document.getElementById("btnCancelarEdicaoMeta").style.display = "none";
}

function excluirMeta(id) {
  abrirModalConfirmacao({
    titulo: "Excluir meta",
    mensagem: "Tem certeza que deseja excluir esta meta?",
    onConfirm: async () => {
      const mensagem = document.getElementById("metaMensagem");

      try {
        const resposta = await fetch(`${API_BASE}/metas/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          const erro = dados.detail || "Não foi possível excluir a meta.";
          mensagem.textContent = erro;
          mensagem.className = "feedback-box error";
          mostrarToast(erro, "error");
          return;
        }

        mensagem.textContent = "Meta excluída com sucesso.";
        mensagem.className = "feedback-box success";

        mostrarToast("Meta excluída com sucesso.", "success");
        limparFormularioMeta();
        carregarMetas();

      } catch (error) {
        mensagem.textContent = "Erro de conexão com a API ao excluir a meta.";
        mensagem.className = "feedback-box error";
        mostrarToast("Erro de conexão com a API ao excluir a meta.", "error");
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
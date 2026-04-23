function mostrarToast(mensagem, tipo = "success") {
  let container = document.getElementById("toastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensagem;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function mostrarLoading(alvoId, mensagem = "Carregando...") {
  const alvo = document.getElementById(alvoId);
  if (!alvo) return;

  alvo.innerHTML = `<div class="loading-box">${mensagem}</div>`;
}

function abrirModalConfirmacao({
  titulo = "Confirmar ação",
  mensagem = "Tem certeza?",
  onConfirm = () => {}
}) {
  let modal = document.getElementById("confirmModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "confirmModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-box">
        <h3 id="modalTitulo"></h3>
        <p id="modalMensagem"></p>
        <div class="modal-actions">
          <button class="secondary-btn" id="modalCancelar">Cancelar</button>
          <button class="danger-btn" id="modalConfirmar">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById("modalTitulo").textContent = titulo;
  document.getElementById("modalMensagem").textContent = mensagem;

  modal.style.display = "flex";

  const btnCancelar = document.getElementById("modalCancelar");
  const btnConfirmar = document.getElementById("modalConfirmar");

  const fechar = () => {
    modal.style.display = "none";
    btnCancelar.onclick = null;
    btnConfirmar.onclick = null;
  };

  btnCancelar.onclick = fechar;
  btnConfirmar.onclick = () => {
    fechar();
    onConfirm();
  };
}
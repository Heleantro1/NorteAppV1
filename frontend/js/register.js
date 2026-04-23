const API_BASE = "http://127.0.0.1:8000";

const form = document.getElementById("registerForm");
const mensagem = document.getElementById("registerMensagem");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  mensagem.textContent = "";
  mensagem.style.color = "#ffffff";

  try {
    const resposta = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nome,
        email,
        senha
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mensagem.textContent = dados.detail || "Erro ao cadastrar usuário.";
      mensagem.style.color = "red";
      return;
    }

    mensagem.textContent = "Cadastro realizado com sucesso! Redirecionando para login...";
    mensagem.style.color = "lightgreen";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (erro) {
    mensagem.textContent = "Não foi possível conectar com a API.";
    mensagem.style.color = "red";
    console.error("Erro no cadastro:", erro);
  }
});
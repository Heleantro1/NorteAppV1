const API_BASE = "http://127.0.0.1:8000";

const loginForm = document.getElementById("loginForm");
const loginMensagem = document.getElementById("loginMensagem");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  loginMensagem.textContent = "Entrando...";
  loginMensagem.className = "mensagem";

  try {
    const resposta = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: email,
        password: senha,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      loginMensagem.textContent = dados.detail || "E-mail ou senha inválidos.";
      loginMensagem.className = "mensagem erro";
      return;
    }

    localStorage.setItem("token", dados.access_token);

    loginMensagem.textContent = "Login realizado com sucesso. Redirecionando...";
    loginMensagem.className = "mensagem sucesso";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);
  } catch (error) {
    loginMensagem.textContent = "Erro ao conectar com o servidor.";
    loginMensagem.className = "mensagem erro";
    console.error("Erro no login:", error);
  }
});
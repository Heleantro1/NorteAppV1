const API_BASE = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("token");
}

function verificarLogin() {
  const token = getToken();

  if (!token) {
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
# 🚀 Norte Financeiro IA

Sistema completo de controle financeiro com integração de Inteligência Artificial para análise de comportamento, geração de insights e recomendações financeiras.

---

## 📌 Visão Geral

O **Norte Financeiro IA** é uma aplicação web fullstack que permite ao usuário:

- Registrar receitas e despesas
- Visualizar relatórios financeiros
- Acompanhar metas e orçamentos
- Receber insights financeiros com IA
- Monitorar comportamento financeiro ao longo do tempo

---

## ⚙️ Tecnologias Utilizadas

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- JWT (autenticação)

### Frontend
- HTML5
- CSS3 (UI moderna estilo fintech)
- JavaScript (Vanilla)

### IA
- Integração com API de IA (OpenAI ou similar)
- Geração de insights financeiros

---

## 🔐 Autenticação

- Registro de usuário
- Login com JWT
- Proteção de rotas
- Token armazenado no frontend

---

## 🚀 Como rodar o projeto

### 1. Clonar repositório

```bash
pip install requirements.txt
cd backend
python -m uvicorn app.main:app --reload
from fastapi import FastAPI

from app.database import Base, engine
from app.routes.auth_routes import router as auth_router
from app.routes.transacoes_routes import router as transacoes_router
from app.routes.relatorios_routes import router as relatorios_router
from app.routes.ia_routes import router as ia_router
from app.routes.metas_routes import router as metas_router
from app.routes.orcamentos_routes import router as orcamentos_router

from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Norte Financeiro IA",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"mensagem": "API Norte Financeiro IA online"}


app.include_router(auth_router)
app.include_router(transacoes_router)
app.include_router(relatorios_router)
app.include_router(ia_router)
app.include_router(metas_router)
app.include_router(orcamentos_router)
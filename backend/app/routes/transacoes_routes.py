from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models import Transacao
from app.deps import get_current_user

router = APIRouter(prefix="/transacoes", tags=["Transações"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def converter_data(data_str):
    if not data_str:
        return datetime.utcnow()

    try:
        return datetime.strptime(data_str, "%Y-%m-%d")
    except ValueError:
        return datetime.utcnow()


@router.post("/")
def criar_transacao(
    dados: dict,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    nova_transacao = Transacao(
        descricao=dados.get("descricao"),
        valor=dados.get("valor"),
        tipo=dados.get("tipo"),
        categoria=dados.get("categoria"),
        data=converter_data(dados.get("data")),
        usuario_id=usuario.id
    )

    db.add(nova_transacao)
    db.commit()
    db.refresh(nova_transacao)

    return nova_transacao


@router.get("/")
def listar_transacoes(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    return db.query(Transacao).filter(
        Transacao.usuario_id == usuario.id
    ).all()


@router.put("/{transacao_id}")
def atualizar_transacao(
    transacao_id: int,
    dados: dict,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    transacao = db.query(Transacao).filter(
        Transacao.id == transacao_id,
        Transacao.usuario_id == usuario.id
    ).first()

    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")

    transacao.descricao = dados.get("descricao")
    transacao.valor = dados.get("valor")
    transacao.tipo = dados.get("tipo")
    transacao.categoria = dados.get("categoria")
    transacao.data = converter_data(dados.get("data"))

    db.commit()
    db.refresh(transacao)

    return transacao


@router.delete("/{transacao_id}")
def excluir_transacao(
    transacao_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    transacao = db.query(Transacao).filter(
        Transacao.id == transacao_id,
        Transacao.usuario_id == usuario.id
    ).first()

    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")

    db.delete(transacao)
    db.commit()

    return {"mensagem": "Transação excluída com sucesso."}
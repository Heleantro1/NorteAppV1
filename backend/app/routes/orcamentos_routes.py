from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract, func

from app.database import SessionLocal
from app.models import OrcamentoMensal, Transacao
from app.deps import get_current_user

router = APIRouter(prefix="/orcamentos", tags=["Orçamentos"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def criar_orcamento(
    dados: dict,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    novo = OrcamentoMensal(
        categoria=dados.get("categoria"),
        limite=dados.get("limite"),
        mes=dados.get("mes"),
        ano=dados.get("ano"),
        usuario_id=usuario.id
    )

    db.add(novo)
    db.commit()
    db.refresh(novo)

    return novo


@router.get("/")
def listar_orcamentos(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    orcamentos = db.query(OrcamentoMensal).filter(
        OrcamentoMensal.usuario_id == usuario.id
    ).all()

    resultado = []

    for orcamento in orcamentos:
        gasto_atual = db.query(func.coalesce(func.sum(Transacao.valor), 0)).filter(
            Transacao.usuario_id == usuario.id,
            Transacao.tipo == "despesa",
            Transacao.categoria == orcamento.categoria,
            extract("month", Transacao.data) == orcamento.mes,
            extract("year", Transacao.data) == orcamento.ano
        ).scalar()

        resultado.append({
            "id": orcamento.id,
            "categoria": orcamento.categoria,
            "limite": orcamento.limite,
            "mes": orcamento.mes,
            "ano": orcamento.ano,
            "gasto_atual": float(gasto_atual or 0)
        })

    return resultado


@router.put("/{orcamento_id}")
def atualizar_orcamento(
    orcamento_id: int,
    dados: dict,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    orcamento = db.query(OrcamentoMensal).filter(
        OrcamentoMensal.id == orcamento_id,
        OrcamentoMensal.usuario_id == usuario.id
    ).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")

    orcamento.categoria = dados.get("categoria")
    orcamento.limite = dados.get("limite")
    orcamento.mes = dados.get("mes")
    orcamento.ano = dados.get("ano")

    db.commit()
    db.refresh(orcamento)

    return orcamento


@router.delete("/{orcamento_id}")
def excluir_orcamento(
    orcamento_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    orcamento = db.query(OrcamentoMensal).filter(
        OrcamentoMensal.id == orcamento_id,
        OrcamentoMensal.usuario_id == usuario.id
    ).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")

    db.delete(orcamento)
    db.commit()

    return {"mensagem": "Orçamento excluído com sucesso."}
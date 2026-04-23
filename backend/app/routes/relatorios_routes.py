from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from datetime import datetime

from app.models import Transacao
from app.services import (
    resumo_financeiro,
    gastos_por_categoria,
    resumo_mensal,
    comparar_despesas_mensais,
    gerar_alertas_financeiros,
    gerar_insights_financeiros,
    calcular_score_financeiro,
    gerar_recomendacoes_financeiras
)
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])


@router.get("/resumo")
def resumo(
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    return resumo_financeiro(db, usuario_atual.id)


@router.get("/gastos-categoria")
def gastos_categoria(
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    return gastos_por_categoria(db, usuario_atual.id)


@router.get("/resumo-mensal")
def resumo_do_mes(
    mes: int,
    ano: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    return resumo_mensal(db, usuario_atual.id, mes, ano)


@router.get("/comparativo-mensal")
def comparativo_mensal(
    mes: int,
    ano: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    return comparar_despesas_mensais(db, usuario_atual.id, mes, ano)


@router.get("/alertas")
def alertas(
    mes: int,
    ano: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    return gerar_alertas_financeiros(db, usuario_atual.id, mes, ano)


@router.get("/insights")
def insights(
    mes: int,
    ano: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    return gerar_insights_financeiros(db, usuario_atual.id, mes, ano)


@router.get("/score")
def score(
    mes: int,
    ano: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    return calcular_score_financeiro(db, usuario_atual.id, mes, ano)


@router.get("/recomendacoes")
def recomendacoes(
    mes: int,
    ano: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    return gerar_recomendacoes_financeiras(db, usuario_atual.id, mes, ano)


@router.get("/historico")
def historico_mensal(
    ano: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    receitas_por_mes = db.query(
        extract("month", Transacao.data).label("mes"),
        func.coalesce(func.sum(Transacao.valor), 0).label("total")
    ).filter(
        Transacao.usuario_id == usuario_atual.id,
        Transacao.tipo == "receita",
        extract("year", Transacao.data) == ano
    ).group_by(
        extract("month", Transacao.data)
    ).all()

    despesas_por_mes = db.query(
        extract("month", Transacao.data).label("mes"),
        func.coalesce(func.sum(Transacao.valor), 0).label("total")
    ).filter(
        Transacao.usuario_id == usuario_atual.id,
        Transacao.tipo == "despesa",
        extract("year", Transacao.data) == ano
    ).group_by(
        extract("month", Transacao.data)
    ).all()

    mapa_receitas = {int(item.mes): float(item.total) for item in receitas_por_mes}
    mapa_despesas = {int(item.mes): float(item.total) for item in despesas_por_mes}

    resultado = []

    for mes in range(1, 13):
        receita = mapa_receitas.get(mes, 0.0)
        despesa = mapa_despesas.get(mes, 0.0)

        resultado.append({
            "mes": mes,
            "receitas": receita,
            "despesas": despesa,
            "saldo": receita - despesa
        })

    return resultado
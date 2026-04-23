from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime


from app.models import Usuario, Transacao
from app.core.security import gerar_hash_senha, verificar_senha


def criar_usuario(db: Session, nome: str, email: str, senha: str):
    usuario_existente = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario_existente:
        return None

    novo_usuario = Usuario(
        nome=nome,
        email=email,
        senha_hash=gerar_hash_senha(senha)
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


def autenticar_usuario(db: Session, email: str, senha: str):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        return None

    if not verificar_senha(senha, usuario.senha_hash):
        return None

    return usuario

def criar_transacao(db, descricao: str, valor: float, tipo: str, categoria: str, usuario_id: int, data: datetime | None = None):
    nova_transacao = Transacao(
        descricao=descricao,
        valor=valor,
        tipo=tipo,
        categoria=categoria,
        usuario_id=usuario_id,
        data=data or datetime.utcnow()
    )

    db.add(nova_transacao)
    db.commit()
    db.refresh(nova_transacao)
    return nova_transacao


def listar_transacoes(db: Session, usuario_id: int):
    return db.query(Transacao).filter(Transacao.usuario_id == usuario_id).all()

def resumo_financeiro(db, usuario_id: int):
    receitas = db.query(func.sum(Transacao.valor)).filter(
        Transacao.usuario_id == usuario_id,
        Transacao.tipo == "receita"
    ).scalar() or 0

    despesas = db.query(func.sum(Transacao.valor)).filter(
        Transacao.usuario_id == usuario_id,
        Transacao.tipo == "despesa"
    ).scalar() or 0

    saldo = receitas - despesas

    return {
        "receitas": receitas,
        "despesas": despesas,
        "saldo": saldo
    }

def gastos_por_categoria(db, usuario_id: int):
    resultados = db.query(
        Transacao.categoria,
        func.sum(Transacao.valor).label("total")
    ).filter(
        Transacao.usuario_id == usuario_id,
        Transacao.tipo == "despesa"
    ).group_by(Transacao.categoria).all()

    return [
        {"categoria": categoria, "total": total}
        for categoria, total in resultados
    ]


def resumo_mensal(db, usuario_id: int, mes: int, ano: int):
    mes_str = f"{mes:02d}"
    ano_str = str(ano)

    receitas = db.query(func.sum(Transacao.valor)).filter(
        Transacao.usuario_id == usuario_id,
        Transacao.tipo == "receita",
        func.strftime("%m", Transacao.data) == mes_str,
        func.strftime("%Y", Transacao.data) == ano_str
    ).scalar() or 0

    despesas = db.query(func.sum(Transacao.valor)).filter(
        Transacao.usuario_id == usuario_id,
        Transacao.tipo == "despesa",
        func.strftime("%m", Transacao.data) == mes_str,
        func.strftime("%Y", Transacao.data) == ano_str
    ).scalar() or 0

    saldo = receitas - despesas

    return {
        "mes": mes,
        "ano": ano,
        "receitas": receitas,
        "despesas": despesas,
        "saldo": saldo
    }


def comparar_despesas_mensais(db, usuario_id: int, mes_atual: int, ano_atual: int):
    if mes_atual == 1:
        mes_anterior = 12
        ano_anterior = ano_atual - 1
    else:
        mes_anterior = mes_atual - 1
        ano_anterior = ano_atual

    despesas_atual = db.query(func.sum(Transacao.valor)).filter(
        Transacao.usuario_id == usuario_id,
        Transacao.tipo == "despesa",
        extract("month", Transacao.data) == mes_atual,
        extract("year", Transacao.data) == ano_atual
    ).scalar() or 0

    despesas_anterior = db.query(func.sum(Transacao.valor)).filter(
        Transacao.usuario_id == usuario_id,
        Transacao.tipo == "despesa",
        extract("month", Transacao.data) == mes_anterior,
        extract("year", Transacao.data) == ano_anterior
    ).scalar() or 0

    variacao = despesas_atual - despesas_anterior

    if despesas_anterior > 0:
        percentual = (variacao / despesas_anterior) * 100
    else:
        percentual = 0

    return {
        "mes_atual": mes_atual,
        "ano_atual": ano_atual,
        "mes_anterior": mes_anterior,
        "ano_anterior": ano_anterior,
        "despesas_mes_atual": despesas_atual,
        "despesas_mes_anterior": despesas_anterior,
        "variacao": variacao,
        "percentual_variacao": round(percentual, 2)
    }

def gerar_alertas_financeiros(db, usuario_id: int, mes: int, ano: int):
    alertas = []

    resumo_atual = resumo_mensal(db, usuario_id, mes, ano)
    comparativo = comparar_despesas_mensais(db, usuario_id, mes, ano)

    if resumo_atual["saldo"] < 0:
        alertas.append("Seu saldo está negativo neste mês.")

    if comparativo["percentual_variacao"] > 20:
        alertas.append(
            f"Suas despesas aumentaram {comparativo['percentual_variacao']}% em relação ao mês anterior."
        )

    categorias = gastos_por_categoria(db, usuario_id)
    if categorias:
        maior_categoria = max(categorias, key=lambda x: x["total"])
        alertas.append(
            f"Sua categoria com maior gasto é '{maior_categoria['categoria']}', com total de R$ {maior_categoria['total']:.2f}."
        )

    if not alertas:
        alertas.append("Nenhum alerta financeiro relevante foi identificado no momento.")

    return {"alertas": alertas}


def gerar_insights_financeiros(db, usuario_id: int, mes: int, ano: int):
    insights = []

    resumo_atual = resumo_mensal(db, usuario_id, mes, ano)
    categorias = gastos_por_categoria(db, usuario_id)

    if resumo_atual["receitas"] > 0:
        taxa_gasto = (resumo_atual["despesas"] / resumo_atual["receitas"]) * 100

        if taxa_gasto > 90:
            insights.append("Você está consumindo mais de 90% da sua renda. Isso indica risco financeiro elevado.")
        elif taxa_gasto > 70:
            insights.append("Seu nível de gastos está alto em relação à renda. Vale revisar despesas variáveis.")
        else:
            insights.append("Seu nível de gastos está relativamente controlado em relação à renda.")

    if categorias:
        maior_categoria = max(categorias, key=lambda x: x["total"])
        insights.append(
            f"A categoria '{maior_categoria['categoria']}' representa seu principal foco de despesas atualmente."
        )

    if resumo_atual["saldo"] > 0:
        insights.append("Você fechou o período com saldo positivo, o que favorece a construção de estabilidade financeira.")
    elif resumo_atual["saldo"] < 0:
        insights.append("Você fechou o período com saldo negativo. O ideal é agir rápido para evitar recorrência.")
    else:
        insights.append("Seu saldo ficou zerado no período. Isso mostra equilíbrio, mas com pouca margem de segurança.")

    return {"insights": insights}

def calcular_score_financeiro(db, usuario_id: int, mes: int, ano: int):
    resumo = resumo_mensal(db, usuario_id, mes, ano)
    comparativo = comparar_despesas_mensais(db, usuario_id, mes, ano)

    score = 100

    if resumo["saldo"] < 0:
        score -= 40
    elif resumo["saldo"] == 0:
        score -= 15
    else:
        score += 0

    if resumo["receitas"] > 0:
        taxa_gasto = (resumo["despesas"] / resumo["receitas"]) * 100

        if taxa_gasto > 100:
            score -= 35
        elif taxa_gasto > 90:
            score -= 25
        elif taxa_gasto > 75:
            score -= 15
        elif taxa_gasto > 60:
            score -= 5

    if comparativo["percentual_variacao"] > 30:
        score -= 20
    elif comparativo["percentual_variacao"] > 15:
        score -= 10

    if score < 0:
        score = 0
    if score > 100:
        score = 100

    if score >= 80:
        nivel = "Estável"
        descricao = "Sua vida financeira apresenta bom nível de equilíbrio."
    elif score >= 60:
        nivel = "Moderado"
        descricao = "Sua situação financeira está razoável, mas há pontos de atenção."
    elif score >= 40:
        nivel = "Em atenção"
        descricao = "Seu comportamento financeiro exige ajustes para evitar instabilidade."
    else:
        nivel = "Crítico"
        descricao = "Seu padrão financeiro atual indica risco elevado de desequilíbrio."

    return {
        "score": score,
        "nivel": nivel,
        "descricao": descricao
    }


def gerar_recomendacoes_financeiras(db, usuario_id: int, mes: int, ano: int):
    recomendacoes = []

    resumo = resumo_mensal(db, usuario_id, mes, ano)
    comparativo = comparar_despesas_mensais(db, usuario_id, mes, ano)
    categorias = gastos_por_categoria(db, usuario_id)
    score = calcular_score_financeiro(db, usuario_id, mes, ano)

    if resumo["saldo"] < 0:
        recomendacoes.append("Reduza despesas imediatamente para evitar recorrência de saldo negativo.")

    if resumo["receitas"] > 0:
        taxa_gasto = (resumo["despesas"] / resumo["receitas"]) * 100

        if taxa_gasto > 90:
            recomendacoes.append("Seu gasto está muito alto em relação à renda. Tente reduzir despesas variáveis.")
        elif taxa_gasto > 75:
            recomendacoes.append("Seu comprometimento da renda está elevado. Reavalie categorias menos essenciais.")

    if comparativo["percentual_variacao"] > 20:
        recomendacoes.append(
            "Suas despesas cresceram em relação ao mês anterior. Revise o que causou esse aumento."
        )

    if categorias:
        maior_categoria = max(categorias, key=lambda x: x["total"])
        recomendacoes.append(
            f"Analise a categoria '{maior_categoria['categoria']}', pois ela concentra a maior parte dos seus gastos."
        )

    if score["score"] >= 80:
        recomendacoes.append("Mantenha sua consistência atual e considere fortalecer sua reserva financeira.")
    elif score["score"] < 60:
        recomendacoes.append("Crie um limite mensal por categoria para recuperar controle financeiro.")

    if not recomendacoes:
        recomendacoes.append("Seu comportamento financeiro atual está equilibrado. Continue monitorando seus hábitos.")

    return {
        "recomendacoes": recomendacoes
    }
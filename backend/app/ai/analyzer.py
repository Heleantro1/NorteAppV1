from app.services import (
    resumo_mensal,
    gerar_alertas_financeiros,
    gerar_insights_financeiros,
    calcular_score_financeiro,
    gerar_recomendacoes_financeiras
)


def analisar_contexto_financeiro(db, usuario_id: int, mes: int, ano: int, mensagem: str):
    resumo = resumo_mensal(db, usuario_id, mes, ano)
    alertas = gerar_alertas_financeiros(db, usuario_id, mes, ano)
    insights = gerar_insights_financeiros(db, usuario_id, mes, ano)
    score = calcular_score_financeiro(db, usuario_id, mes, ano)
    recomendacoes = gerar_recomendacoes_financeiras(db, usuario_id, mes, ano)

    resposta = []

    resposta.append(
        f"No período {mes}/{ano}, você teve receitas de R$ {resumo['receitas']:.2f}, "
        f"despesas de R$ {resumo['despesas']:.2f} e saldo de R$ {resumo['saldo']:.2f}."
    )

    resposta.append(
        f"Seu score financeiro atual é {score['score']}, classificado como '{score['nivel']}'."
    )

    if alertas["alertas"]:
        resposta.append("Alertas identificados:")
        for alerta in alertas["alertas"]:
            resposta.append(f"- {alerta}")

    if insights["insights"]:
        resposta.append("Principais insights:")
        for insight in insights["insights"]:
            resposta.append(f"- {insight}")

    if recomendacoes["recomendacoes"]:
        resposta.append("Recomendações:")
        for recomendacao in recomendacoes["recomendacoes"]:
            resposta.append(f"- {recomendacao}")

    return {
    "mensagem_recebida": mensagem,
    "resumo": f"No período {mes}/{ano}, você teve receitas de R$ {resumo['receitas']:.2f}, despesas de R$ {resumo['despesas']:.2f} e saldo de R$ {resumo['saldo']:.2f}.",
    "score": score,
    "alertas": alertas["alertas"],
    "insights": insights["insights"],
    "recomendacoes": recomendacoes["recomendacoes"]
}
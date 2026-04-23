from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.ai.analyzer import analisar_contexto_financeiro

router = APIRouter(prefix="/ia", tags=["IA"])


class PerguntaFinanceira(BaseModel):
    mensagem: str
    mes: int
    ano: int


@router.post("/analisar")
def analisar(
    dados: PerguntaFinanceira,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_current_user)
):
    return analisar_contexto_financeiro(
        db=db,
        usuario_id=usuario_atual.id,
        mes=dados.mes,
        ano=dados.ano,
        mensagem=dados.mensagem
    )
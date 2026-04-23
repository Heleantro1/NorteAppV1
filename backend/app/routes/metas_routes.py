from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import MetaFinanceira
from app.deps import get_current_user

router = APIRouter(prefix="/metas", tags=["Metas"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def criar_meta(
    dados: dict,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    nova_meta = MetaFinanceira(
        titulo=dados.get("titulo"),
        valor_meta=dados.get("valor_meta"),
        valor_atual=dados.get("valor_atual"),
        prazo=dados.get("prazo"),
        usuario_id=usuario.id
    )

    db.add(nova_meta)
    db.commit()
    db.refresh(nova_meta)

    return nova_meta


@router.get("/")
def listar_metas(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    metas = db.query(MetaFinanceira).filter(
        MetaFinanceira.usuario_id == usuario.id
    ).all()

    return metas


@router.put("/{meta_id}")
def atualizar_meta(
    meta_id: int,
    dados: dict,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    meta = db.query(MetaFinanceira).filter(
        MetaFinanceira.id == meta_id,
        MetaFinanceira.usuario_id == usuario.id
    ).first()

    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada.")

    meta.titulo = dados.get("titulo")
    meta.valor_meta = dados.get("valor_meta")
    meta.valor_atual = dados.get("valor_atual")
    meta.prazo = dados.get("prazo")

    db.commit()
    db.refresh(meta)

    return meta


@router.delete("/{meta_id}")
def excluir_meta(
    meta_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    meta = db.query(MetaFinanceira).filter(
        MetaFinanceira.id == meta_id,
        MetaFinanceira.usuario_id == usuario.id
    ).first()

    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada.")

    db.delete(meta)
    db.commit()

    return {"mensagem": "Meta excluída com sucesso."}
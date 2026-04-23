from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)

    transacoes = relationship("Transacao", back_populates="usuario")


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String, nullable=False)
    valor = Column(Float, nullable=False)
    tipo = Column(String, nullable=False)
    categoria = Column(String, nullable=False)
    data = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    usuario = relationship("Usuario", back_populates="transacoes")

class MetaFinanceira(Base):
    __tablename__ = "metas_financeiras"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    valor_meta = Column(Float, nullable=False)
    valor_atual = Column(Float, default=0)
    prazo = Column(String)

    usuario_id = Column(Integer, ForeignKey("usuarios.id"))


class OrcamentoMensal(Base):
    __tablename__ = "orcamentos_mensais"

    id = Column(Integer, primary_key=True, index=True)
    categoria = Column(String, nullable=False)
    limite = Column(Float, nullable=False)
    mes = Column(Integer, nullable=False)
    ano = Column(Integer, nullable=False)

    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
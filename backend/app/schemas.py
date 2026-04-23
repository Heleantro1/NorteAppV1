from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal
from datetime import datetime

class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str


class UserLogin(BaseModel):
    email: EmailStr
    senha: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr

    model_config = {"from_attributes": True}


class TransacaoCreate(BaseModel):
    descricao: str
    valor: float
    tipo: Literal["receita", "despesa"]
    categoria: str
    data: datetime | None = None
    
    @field_validator("valor")
    @classmethod
    def valor_deve_ser_positivo(cls, v: float):
        if v <= 0:
            raise ValueError("O valor deve ser maior que zero")
        return v


class TransacaoResponse(BaseModel):
    id: int
    descricao: str
    valor: float
    tipo: str
    categoria: str
    usuario_id: int

    model_config = {"from_attributes": True}



from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.schemas import UserCreate, Token, UsuarioResponse
from app.services import criar_usuario, autenticar_usuario
from app.deps import get_db
from app.core.security import criar_access_token

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", response_model=UsuarioResponse)
def register(dados: UserCreate, db: Session = Depends(get_db)):
    usuario = criar_usuario(db, dados.nome, dados.email, dados.senha)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já cadastrado"
        )
    return usuario


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    usuario = autenticar_usuario(db, form_data.username, form_data.password)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )

    access_token = criar_access_token(data={"sub": usuario.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
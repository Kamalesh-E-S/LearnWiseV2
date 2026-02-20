from fastapi import APIRouter, Depends, HTTPException, status, Form, Request # type: ignore
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm # type: ignore
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, Token
from app.auth.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from datetime import datetime, timedelta
from jose import JWTError, jwt # type: ignore

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Get user by email
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

# Authenticate user
def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return False
    return user

# Signup route
@router.post("/signup")
async def signup(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        # Validate input using Pydantic model
        user_data = UserCreate(email=email, password=password)

        # Check for existing user
        existing_user = get_user_by_email(db, user_data.email)
        if existing_user:
            return JSONResponse(
                status_code=400,
                content={"detail": "Email already registered"}
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            created_at=datetime.utcnow()
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return jsonable_encoder(UserResponse(
            id=new_user.id,
            email=new_user.email,
            created_at=new_user.created_at
        ))

    except ValidationError as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": e.errors()}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred"}
        )

# Login route
@router.post("/login")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Incorrect email or password"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()

        # Create access token using the constant from security.py
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except ValidationError as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": e.errors()}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred"}
        )

# Get current user
@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/change-password")
async def change_password(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allow authenticated users to change their password."""
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="current_password and new_password are required")

    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    if len(new_password) < 5:
        raise HTTPException(status_code=400, detail="New password must be at least 5 characters")

    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"success": True, "message": "Password updated successfully"}
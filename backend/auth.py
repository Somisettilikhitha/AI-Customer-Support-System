from datetime import datetime, timedelta, timezone

import jwt
import os
import secrets
import hashlib
import smtplib


from email.message import EmailMessage
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from sqlalchemy import select

from database import SessionLocal

from models import User, PasswordResetToken

from schemas import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

from security import (
    hash_password,
    verify_password,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = (
    "7f4c9a2e8d1b6f3a0c9e5d7b2a8f1c6e4d9b3a7f0c2e8d5"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30


# ============================================================
# BEARER TOKEN SECURITY
# ============================================================

security = HTTPBearer()

# ============================================================
# SEND PASSWORD RESET EMAIL
# ============================================================


def send_password_reset_email(
    recipient_email: str,
    reset_link: str,
) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_FROM_EMAIL")

    if not all([
        smtp_host,
        smtp_username,
        smtp_password,
        sender_email,
    ]):
        raise RuntimeError(
            "SMTP settings are not configured."
        )

    message = EmailMessage()
    message["Subject"] = "Reset your customer support account password"
    message["From"] = sender_email
    message["To"] = recipient_email

    message.set_content(
        "We received a request to reset your password.\n\n"
        f"Open this link to choose a new password:\n{reset_link}\n\n"
        "This link expires in 15 minutes and can only be used once.\n"
        "If you did not request this, ignore this email."
    )

    with smtplib.SMTP(
        smtp_host, smtp_port, timeout=15
    ) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(message)

# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(
    user_id: int,
    role: str
) -> str:

    # --------------------------------------------------------
    # Calculate token expiration time
    # --------------------------------------------------------

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    # --------------------------------------------------------
    # JWT payload
    # --------------------------------------------------------

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }

    # --------------------------------------------------------
    # Create JWT token
    # --------------------------------------------------------

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return token


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    )
):
    """
    Read the JWT token and return the authenticated
    user's ID.
    """

    token = credentials.credentials

    try:

        # ----------------------------------------------------
        # Decode JWT
        # ----------------------------------------------------

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        # ----------------------------------------------------
        # Get user ID
        # ----------------------------------------------------

        user_id = payload.get("sub")

        if user_id is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        # ----------------------------------------------------
        # Convert user ID to integer
        # ----------------------------------------------------

        try:

            user_id = int(user_id)

        except (
            TypeError,
            ValueError,
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        return user_id

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Token has expired",
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )


# ============================================================
# GET CURRENT AGENT
# ============================================================

def get_current_agent(
    user_id: int = Depends(
        get_current_user
    )
):
    """
    Allow access only when the authenticated user
    has the 'agent' role.
    """

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Find user
        # ----------------------------------------------------

        user = db.scalar(
            select(User).where(
                User.id == user_id
            )
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        # ----------------------------------------------------
        # Check agent role
        # ----------------------------------------------------

        if user.role != "agent":

            raise HTTPException(
                status_code=403,
                detail="Agent access required",
            )

        # ----------------------------------------------------
        # Return agent ID
        # ----------------------------------------------------

        return user.id

    finally:

        db.close()


# ============================================================
# GET CURRENT ADMIN
# ============================================================

def get_current_admin(
    user_id: int = Depends(
        get_current_user
    )
):
    """
    Allow access only when the authenticated user
    has the 'admin' role.
    """

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Find user
        # ----------------------------------------------------

        user = db.scalar(
            select(User).where(
                User.id == user_id
            )
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        # ----------------------------------------------------
        # Check admin role
        # ----------------------------------------------------

        if user.role != "admin":

            raise HTTPException(
                status_code=403,
                detail="Admin access required",
            )

        return user.id

    finally:

        db.close()


# ============================================================
# REGISTER
# POST /auth/register
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
)
def register(
    user_data: RegisterRequest
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Check whether email already exists
        # ----------------------------------------------------

        existing_user = db.scalar(
            select(User).where(
                User.email == user_data.email
            )
        )

        if existing_user:

            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

        # ----------------------------------------------------
        # Hash password
        # ----------------------------------------------------

        hashed_password = hash_password(
            user_data.password
        )

        # ----------------------------------------------------
        # Get requested role
        #
        # If RegisterRequest does not contain "role",
        # default to customer.
        # ----------------------------------------------------

        requested_role = getattr(
            user_data,
            "role",
            "customer",
        )

        # ----------------------------------------------------
        # Normalize role
        # ----------------------------------------------------

        requested_role = (
            requested_role
            or "customer"
        ).lower().strip()

        # ----------------------------------------------------
        # Validate role
        # ----------------------------------------------------

        allowed_roles = {
            "customer",
            "agent",
        }

        if requested_role not in allowed_roles:

            raise HTTPException(
                status_code=400,
                detail="Invalid role",
            )

        # ----------------------------------------------------
        # Create user
        # ----------------------------------------------------

        user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password,
            role=requested_role,
        )

        db.add(user)

        db.commit()

        db.refresh(user)

        return user

    finally:

        db.close()


# ============================================================
# LOGIN
# POST /auth/login
# ============================================================

@router.post(
    "/login"
)
def login(
    user_data: LoginRequest
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Find user by email
        # ----------------------------------------------------

        user = db.scalar(
            select(User).where(
                User.email == user_data.email
            )
        )

        # ----------------------------------------------------
        # User does not exist
        # ----------------------------------------------------

        if user is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        # ----------------------------------------------------
        # Verify password
        # ----------------------------------------------------

        password_valid = verify_password(
            user_data.password,
            user.password_hash,
        )

        if not password_valid:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        # ----------------------------------------------------
        # Create JWT
        # ----------------------------------------------------

        access_token = create_access_token(
            user_id=user.id,
            role=user.role,
        )

        # ----------------------------------------------------
        # Return login response
        # ----------------------------------------------------

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            },
        }

    finally:

        db.close()


# ============================================================
# GET CURRENT USER
# GET /auth/me
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    user_id: int = Depends(
        get_current_user
    )
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Find authenticated user
        # ----------------------------------------------------

        user = db.scalar(
            select(User).where(
                User.id == user_id
            )
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        return user

    finally:

        db.close()

# -----------------------------------------------------------
# FORGET PASSWORD
# -----------------------------------------------------------


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    db = SessionLocal()

    try:
        response = {
            "message": (
                "If an account exists for that email, "
                "password reset instructions will be sent."
            )
        }

        user = db.scalar(
            select(User).where(
                User.email == str(request.email)
            )
        )

        if user is None:
            return response

        now = datetime.now(timezone.utc)

        # Invalidate any previous unused tokens.
        old_tokens = db.scalars(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used_at.is_(None),
            )
        ).all()

        for old_token in old_tokens:
            old_token.used_at = now

        # Generate a secure, random token.
        raw_token = secrets.token_urlsafe(32)

        # Store only the token hash in PostgreSQL.
        token_hash = hashlib.sha256(
            raw_token.encode("utf-8")
        ).hexdigest()

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=now + timedelta(minutes=15),
        )

        db.add(reset_record)
        db.commit()

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173",
        ).rstrip("/")

        reset_link = (
            f"{frontend_url}/reset-password"
            f"?token={raw_token}"
        )
        # LOCAL DEVELOPMENT ONLY.
        # Never expose reset links in production.
        return {
            "message": (
                "If an account exists for that email, "
                "password reset instructions will be sent."
            ),
            "reset_link": reset_link,
        }

    finally:
        db.close()


# -----------------------------------------------------------
# RESET PASSWORD
# -----------------------------------------------------------


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    db = SessionLocal()

    try:
        token_hash = hashlib.sha256(
            request.token.encode("utf-8")
        ).hexdigest()

        reset_record = db.scalar(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash
            )
        )

        if reset_record is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset link.",
            )

        now = datetime.now(timezone.utc)

        # PostgreSQL may return a naive datetime for
        # timestamp columns, depending on the column type.
        expires_at = reset_record.expires_at

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if (
            reset_record.used_at is not None
            or expires_at <= now
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset link.",
            )

        user = db.scalar(
            select(User).where(
                User.id == reset_record.user_id
            )
        )

        if user is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset link.",
            )

        user.password_hash = hash_password(
            request.new_password
        )

        # Invalidate all outstanding reset tokens for the user.
        outstanding_tokens = db.scalars(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used_at.is_(None),
            )
        ).all()

        for token_record in outstanding_tokens:
            token_record.used_at = now

        db.commit()

        return {
            "message": (
                "Password reset successful. "
                "Please log in with your new password."
            )
        }

    finally:
        db.close()


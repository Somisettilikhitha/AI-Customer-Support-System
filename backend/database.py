
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

from models import Base

load_dotenv()

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg",
    username=os.getenv("DB_USERNAME", "postgres"),
    password=os.getenv("DB_PASSWORD", ""),
    host=os.getenv("DB_HOST", "localhost"),
    port=5432,
    database=os.getenv("DB_NAME", "customer_support_db"),
)

db_host = os.getenv("DB_HOST", "localhost")

ssl_mode = (
    "disable"
    if db_host in ("localhost", "127.0.0.1")
    else "require"
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": ssl_mode},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from sqlalchemy import create_engine
from sqlalchemy.engine import make_url

from app.core.config import settings


database_url = make_url(settings.DATABASE_URL).set(
    drivername="postgresql+psycopg"
)

engine = create_engine(
    database_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    pool_recycle=300,
    pool_timeout=30,
    connect_args={
        "connect_timeout": 10,
    },
)

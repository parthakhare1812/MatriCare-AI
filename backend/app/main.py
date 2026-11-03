from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Maternal Healthcare Management and Follow-up Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to MatriCare AI",
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


app.include_router(
    api_router,
    prefix=settings.API_V1_PREFIX
)
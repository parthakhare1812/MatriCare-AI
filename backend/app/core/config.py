
from functools import lru_cache

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "MatriCare AI"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    DATABASE_URL: str
    SECRET_KEY: str

    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        gt=0,
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("APP_ENV")
    @classmethod
    def validate_app_env(cls, value: str) -> str:
        value = value.strip().lower()

        allowed = {
            "development",
            "testing",
            "staging",
            "production",
        }

        if value not in allowed:
            raise ValueError(
                "APP_ENV must be development, testing, staging, or production."
            )

        return value

    @field_validator("JWT_ALGORITHM")
    @classmethod
    def validate_jwt_algorithm(cls, value: str) -> str:
        if value != "HS256":
            raise ValueError("Only HS256 is supported.")

        return value

    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def validate_origins(cls, value: list[str]) -> list[str]:
        origins = [
            origin.strip().rstrip("/")
            for origin in value
        ]

        if not origins or any(not origin for origin in origins):
            raise ValueError("ALLOWED_ORIGINS cannot be empty.")

        if "*" in origins:
            raise ValueError(
                "Wildcard CORS origins are not permitted."
            )

        if any(
            not origin.startswith(("http://", "https://"))
            for origin in origins
        ):
            raise ValueError(
                "Every allowed origin must use HTTP or HTTPS."
            )

        return origins

    @model_validator(mode="after")
    def validate_environment(self):
        if not self.DATABASE_URL.strip():
            raise ValueError("DATABASE_URL cannot be empty.")

        if not self.SECRET_KEY.strip():
            raise ValueError("SECRET_KEY cannot be empty.")

        if self.APP_ENV == "production":
            if self.DEBUG:
                raise ValueError(
                    "DEBUG must be False in production."
                )

            if len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "Production SECRET_KEY must contain at least 32 characters."
                )

            if any(
                origin.startswith("http://")
                for origin in self.ALLOWED_ORIGINS
            ):
                raise ValueError(
                    "Production CORS origins must use HTTPS."
                )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

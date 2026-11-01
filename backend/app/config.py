import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"
BACKUPS_DIR = BACKEND_DIR / "backups"
BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    # Base directories
    DATA_DIR: Path = DATA_DIR
    BACKUPS_DIR: Path = BACKUPS_DIR

    # --- Multi-Account LLM & Fallback Configuration ---
    # Supports comma-separated keys for multiple accounts: GEMINI_API_KEYS="key1,key2,key3"
    GEMINI_API_KEYS: str = ""
    GEMINI_API_KEY: Optional[str] = None  # Backward compatibility
    GEMINI_MODEL: str = "gemini-3-flash-preview"
    
    # Ollama Local Model Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"  # or llama3.1, mistral, qwen2.5, deepseek-r1
    
    # Optional Cloud Providers
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    # Preferred Primary Provider: "gemini", "ollama", "openai", "groq"
    DEFAULT_AI_PROVIDER: str = "gemini"

    # --- Database Configuration (MySQL with SQLite fallback) ---
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'app.db'}"
    # Example MySQL: "mysql+pymysql://root:password@localhost:3306/resume_db"
    
    # --- Authentication (JWT & Security) ---
    JWT_SECRET_KEY: str = "proresume-super-secret-key-change-in-prod-2026-ats"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Public-use rate limits & caps
    RATE_LIMIT_PER_MINUTE_PER_IP: int = 60
    DAILY_CAP_PER_IP: int = 200
    GLOBAL_DAILY_CAP: int = 5000
    
    # Upload & input safety
    REQUEST_TIMEOUT_SECONDS: int = 60
    MAX_UPLOAD_SIZE_MB: int = 10
    MAX_UPLOAD_PAGES: int = 10
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx"]
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]

    model_config = SettingsConfigDict(
        env_file=(str(ENV_FILE), ".env", "backend/.env"),
        extra="ignore"
    )

    def get_gemini_keys_list(self) -> List[str]:
        keys = []
        if self.GEMINI_API_KEYS and self.GEMINI_API_KEYS.strip():
            for k in self.GEMINI_API_KEYS.split(","):
                k = k.strip()
                if k and k not in keys:
                    keys.append(k)
        if self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip():
            k = self.GEMINI_API_KEY.strip()
            if k not in keys:
                keys.append(k)
        return keys

settings = Settings()

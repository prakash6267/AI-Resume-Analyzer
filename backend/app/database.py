import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("resumeai.database")

Base = declarative_base()

def get_engine_and_session():
    db_url = settings.DATABASE_URL
    is_mysql = db_url.startswith("mysql")
    
    try:
        if is_mysql:
            logger.info(f"Attempting to connect to MySQL database...")
            # For MySQL, use connection pool & pre-ping
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                pool_size=10,
                max_overflow=20
            )
            # Test connection immediately
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to MySQL database!")
            return engine, is_mysql
    except Exception as e:
        logger.warning(
            f"MySQL connection failed ({e}). Falling back to local SQLite database to prevent downtime."
        )
    
    # Fallback to SQLite
    sqlite_path = settings.DATA_DIR / "app.db"
    sqlite_url = f"sqlite:///{sqlite_path}"
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False}
    )
    return engine, False

engine, is_connected_to_mysql = get_engine_and_session()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all database tables automatically and apply missing column migrations."""
    try:
        from app import models  # Ensure all models are imported
        from sqlalchemy import inspect
        Base.metadata.create_all(bind=engine)
        
        # Auto-migrate any missing columns in existing tables
        with engine.connect() as conn:
            inspector = inspect(engine)
            for table_name, table in Base.metadata.tables.items():
                if inspector.has_table(table_name):
                    existing_cols = {col["name"] for col in inspector.get_columns(table_name)}
                    for col in table.columns:
                        if col.name not in existing_cols:
                            col_type = col.type.compile(engine.dialect)
                            logger.info(f"Adding missing column '{col.name}' to table '{table_name}'")
                            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type}"))
                            conn.commit()

        # Seed default demo account if it doesn't exist
        with SessionLocal() as db_session:
            demo_user = db_session.query(models.User).filter(models.User.email == "demo@careerforge.com").first()
            if not demo_user:
                demo_user = models.User(
                    email="demo@careerforge.com",
                    # bcrypt hash of 'password123'
                    password_hash="$2b$12$R0IuPsLECQgku5zufySb4.OlinGm4cL30tu0s2ncVsXIHAyYZX2V.",
                    full_name="Demo User",
                    role="candidate",
                    is_active=True
                )
                db_session.add(demo_user)
                db_session.commit()
                logger.info("Demo user 'demo@careerforge.com' initialized.")

        logger.info("Database schema synchronized and tables verified.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}", exc_info=True)

def get_db():
    """FastAPI Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

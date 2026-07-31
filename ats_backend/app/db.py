# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy.ext.declarative import declarative_base   # ✅ ADD

# import os
# from dotenv import load_dotenv
# from urllib.parse import quote_plus

# load_dotenv()


# DB_PASS = quote_plus(os.getenv("DB_PASS"))

# DB_URL = f"mysql+pymysql://{os.getenv('DB_USER')}:{DB_PASS}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"


# engine = create_engine(DB_URL)

# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine
# )


# Base = declarative_base()   # ✅ ADD THIS LINE
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.base import Base
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

DB_TYPE = os.getenv("DB_TYPE", "mysql").lower()
DB_USER = os.getenv("DB_USER")
DB_PASS = quote_plus(os.getenv("DB_PASS"))
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")

# =========================
# BUILD CONNECTION STRING
# =========================
if DB_TYPE == "mysql":
    DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

elif DB_TYPE == "postgresql":
    DB_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

elif DB_TYPE == "mssql":
    DB_URL = f"mssql+pyodbc://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?driver=ODBC+Driver+17+for+SQL+Server"

else:
    raise Exception("Unsupported DB_TYPE")

# =========================
# ENGINE + SESSION
# =========================
connect_args = {}
if DB_TYPE == "mysql" and DB_HOST and "aivencloud.com" in DB_HOST:
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ctx

engine = create_engine(DB_URL, connect_args=connect_args)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

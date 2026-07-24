from passlib.context import CryptContext
from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Password hash
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password, hash):
    return pwd_context.verify(password, hash)


# Encryption
FERNET_KEY = os.getenv("FERNET_KEY").encode()
cipher = Fernet(FERNET_KEY)

def encrypt_data(data: str):
    return cipher.encrypt(data.encode()).decode()

def decrypt_data(data: str):
    return cipher.decrypt(data.encode()).decode()

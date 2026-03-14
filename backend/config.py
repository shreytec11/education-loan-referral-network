import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute path to the root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    BANK_COMMISSION_RATE: float = 0.01  # 1% of loan disbursed = total admin profit
    AMBASSADOR_COMMISSION_RATE: float = 0.003  # 0.3% of loan disbursed = ambassador commission
    
    model_config = SettingsConfigDict(env_file=ENV_PATH, env_file_encoding='utf-8', extra='ignore')

settings = Settings()

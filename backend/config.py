from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "mysql+pymysql://zakupomat:123frytki@localhost/zakupomat"

    class Config:
        env_file = ".env"


settings = Settings()

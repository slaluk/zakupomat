from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routes import auth, products, shopping, sse

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zakupomat API")

# CORS - allow all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(shopping.router, prefix="/api")
app.include_router(sse.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

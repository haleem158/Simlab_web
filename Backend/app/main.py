# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import token_supply, token_impact, vesting  # Add token_impact

# The interactive API docs are off by default. For local development set ENABLE_DOCS=1
# and open /api/docs.
DOCS_ON = os.getenv("ENABLE_DOCS", "").strip().lower() in ("1", "true", "yes")

app = FastAPI(
    title="SIMLAB API",
    description="Tokenomics Simulation API for Web3 protocols",
    version="1.0.0",
    docs_url="/api/docs" if DOCS_ON else None,
    redoc_url="/api/redoc" if DOCS_ON else None,
    openapi_url="/api/openapi.json" if DOCS_ON else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://simlab-web.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    # Vercel preview deployments (a "*" inside allow_origins is not a wildcard)
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(token_supply.router, prefix="/api/v1/token-supply", tags=["Token Supply"])
app.include_router(token_impact.router, prefix="/api/v1/token-impact", tags=["Token Impact"])  # Add this
app.include_router(vesting.router, prefix="/api/v1/vesting", tags=["Vesting"])

@app.get("/")
async def root():
    info = {"message": "SIMLAB API", "version": "1.0.0"}
    if DOCS_ON:
        info["docs"] = "/api/docs"
    return info

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import token_supply, token_impact, vesting  # Add token_impact

app = FastAPI(
    title="SIMLAB API",
    description="Tokenomics Simulation API for Web3 protocols",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
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
    return {
        "message": "SIMLAB API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
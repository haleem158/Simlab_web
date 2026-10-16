from fastapi import APIRouter, HTTPException

from app.models.valuation import ValuationParams, ValuationResponse
from app.services.valuation import run_valuation

router = APIRouter()


@router.post("/run", response_model=ValuationResponse)
async def run(params: ValuationParams):
    """Value a token several ways and price in the lock-up discount."""
    try:
        return run_valuation(params)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Valuation failed: {e}")

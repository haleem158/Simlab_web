from fastapi import APIRouter, HTTPException

from app.models.valuation import ValuationParams, ValuationResponse
from app.services.valuation import run_valuation
from app.services.interpretation import read_valuation

router = APIRouter()


@router.post("/run", response_model=ValuationResponse)
async def run(params: ValuationParams):
    """Value a token several ways and price in the lock-up discount."""
    try:
        res = run_valuation(params)
        res.reading = read_valuation(params, res)
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Valuation failed: {e}")

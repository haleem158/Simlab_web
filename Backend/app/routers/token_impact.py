# backend/app/routers/token_impact.py
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.token_impact import (
    TokenImpactParams, 
    TokenImpactResponse, 
    CSVRow,
    SampleCSVResponse
)
from app.services.token_impact_simulator import TokenImpactSimulator
import pandas as pd
from io import StringIO

router = APIRouter()

@router.post("/simulate", response_model=TokenImpactResponse)
async def simulate_token_impact(params: TokenImpactParams):
    """Run token impact simulation"""
    try:
        results = TokenImpactSimulator.simulate(params)
        
        final = results[-1]
        summary = {
            "final_effective_supply": final.effective_supply,
            "final_demand_index": final.demand_index,
            "final_price": final.indicative_price
        }
        
        metadata = {
            "total_months": len(results),
            "calibrated": params.calibrate
        }
        
        return TokenImpactResponse(
            success=True,
            params=params,
            data=results,
            summary=summary,
            metadata=metadata
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Parse uploaded CSV and return structured data"""
    try:
        contents = await file.read()
        df = pd.read_csv(StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required = ["Month", "Unlocked Tokens", "Emission", 
                   "Transaction Volume Growth (%)", "Staking Participation Growth (%)"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")
        
        # Convert to CSVRow format
        csv_data = []
        for _, row in df.iterrows():
            csv_data.append(CSVRow(
                month=str(row["Month"]),
                unlocked_tokens=float(row["Unlocked Tokens"]),
                emission=float(row["Emission"]),
                tx_volume_growth_pct=float(row["Transaction Volume Growth (%)"]),
                staking_growth_pct=float(row["Staking Participation Growth (%)"]),
                locked=float(row.get("Locked", 0)),
                staked=float(row.get("Staked", 0))
            ))
        
        return {"success": True, "data": csv_data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing failed: {str(e)}")

@router.get("/sample-csv", response_model=SampleCSVResponse)
async def get_sample_csv():
    """Return sample CSV data"""
    sample = [
        CSVRow(
            month="2025-01-01",
            unlocked_tokens=100000,
            emission=50000,
            tx_volume_growth_pct=10,
            staking_growth_pct=5,
            locked=20000,
            staked=30000
        ),
        CSVRow(
            month="2025-02-01",
            unlocked_tokens=120000,
            emission=60000,
            tx_volume_growth_pct=12,
            staking_growth_pct=6,
            locked=21000,
            staked=35000
        ),
        CSVRow(
            month="2025-03-01",
            unlocked_tokens=110000,
            emission=55000,
            tx_volume_growth_pct=8,
            staking_growth_pct=4,
            locked=22000,
            staked=31000
        ),
    ]
    return SampleCSVResponse(success=True, data=sample)
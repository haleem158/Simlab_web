from fastapi import APIRouter, HTTPException
from app.models.vesting import (
    VestingParams,
    VestingResponse,
    VestingProfile,
    VestingRole
)
from app.services.vesting_simulator import VestingSimulator
from typing import List
import uuid
from datetime import datetime

router = APIRouter()

# In-memory storage for profiles (use database in production)
profiles_storage: dict[str, VestingProfile] = {}

@router.post("/simulate", response_model=VestingResponse)
async def simulate_vesting(params: VestingParams):
    """
    Run vesting schedule simulation
    
    Returns monthly unlock data for all roles with:
    - Total unlocked tokens
    - Effective circulating supply
    - Governance-locked tokens
    - Monthly inflation rate
    - Per-role breakdown
    """
    try:
        # Validate that we have roles
        if not params.roles or len(params.roles) == 0:
            raise HTTPException(status_code=400, detail="At least one role is required")
        
        # Run simulation
        results = VestingSimulator.simulate(params)
        
        # Calculate present value
        pv_unlocked = VestingSimulator.calculate_present_value(
            results,
            params.annual_discount_rate
        )
        
        # Build summary
        final = results[-1]
        summary = {
            "final_cumulative_unlocked": final.total_unlocked,
            "final_effective_circulating": final.effective_circulating,
            "final_governance_locked": final.governance_locked,
            "pv_unlocked": pv_unlocked,
            "total_months": len(results)
        }
        
        metadata = {
            "simulation_type": "stochastic" if params.stochastic else "deterministic",
            "num_roles": len(params.roles),
            "total_allocation_pct": sum(role.allocation_pct for role in params.roles)
        }
        
        return VestingResponse(
            success=True,
            params=params,
            data=results,
            summary=summary,
            metadata=metadata
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Simulation failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console for debugging
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.post("/profiles", response_model=VestingProfile)
async def save_profile(name: str, params: VestingParams):
    """Save a vesting profile for later retrieval"""
    try:
        # Run simulation to get summary
        results = VestingSimulator.simulate(params)
        pv_unlocked = VestingSimulator.calculate_present_value(results, params.annual_discount_rate)
        
        final = results[-1]
        summary = {
            "final_cumulative_unlocked": final.total_unlocked,
            "final_effective_circulating": final.effective_circulating,
            "pv_unlocked": pv_unlocked
        }
        
        profile = VestingProfile(
            id=str(uuid.uuid4()),
            name=name,
            created_at=datetime.utcnow().isoformat(),
            params=params,
            summary=summary
        )
        
        profiles_storage[profile.id] = profile
        return profile
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")

@router.get("/profiles", response_model=List[VestingProfile])
async def list_profiles():
    """List all saved vesting profiles"""
    return list(profiles_storage.values())

@router.get("/profiles/{profile_id}", response_model=VestingProfile)
async def get_profile(profile_id: str):
    """Retrieve a specific vesting profile"""
    if profile_id not in profiles_storage:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profiles_storage[profile_id]

@router.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    """Delete a vesting profile"""
    if profile_id not in profiles_storage:
        raise HTTPException(status_code=404, detail="Profile not found")
    del profiles_storage[profile_id]
    return {"success": True, "message": "Profile deleted"}

@router.get("/presets")
async def get_presets():
    """Get predefined vesting scenarios"""
    
    presets = [
        {
            "name": "Standard Startup",
            "description": "Typical Web3 startup allocation with 4-year team vesting",
            "params": {
                "total_supply": 1_000_000_000,
                "months": 60,
                "roles": [
                    {
                        "name": "Team",
                        "allocation_pct": 20.0,
                        "cliff_months": 12,
                        "vesting_months": 48,
                        "activation_ratio": 0.7,
                        "governance_fraction": 0.1
                    },
                    {
                        "name": "Investors",
                        "allocation_pct": 25.0,
                        "cliff_months": 6,
                        "vesting_months": 24,
                        "activation_ratio": 0.8,
                        "governance_fraction": 0.0
                    },
                    {
                        "name": "Community",
                        "allocation_pct": 40.0,
                        "cliff_months": 0,
                        "vesting_months": 60,
                        "activation_ratio": 0.9,
                        "governance_fraction": 0.05
                    },
                    {
                        "name": "Foundation",
                        "allocation_pct": 15.0,
                        "cliff_months": 0,
                        "vesting_months": 60,
                        "activation_ratio": 0.5,
                        "governance_fraction": 0.3
                    }
                ],
                "stochastic": False,
                "noise_std_pct": 0.05,
                "seed": 42,
                "annual_discount_rate": 0.10,
                "clip_to_total": True
            }
        },
        {
            "name": "DAO Governance",
            "description": "DAO-focused with high governance allocation",
            "params": {
                "total_supply": 500_000_000,
                "months": 48,
                "roles": [
                    {
                        "name": "Core Team",
                        "allocation_pct": 15.0,
                        "cliff_months": 12,
                        "vesting_months": 36,
                        "activation_ratio": 0.6,
                        "governance_fraction": 0.2
                    },
                    {
                        "name": "DAO Treasury",
                        "allocation_pct": 50.0,
                        "cliff_months": 0,
                        "vesting_months": 48,
                        "activation_ratio": 0.3,
                        "governance_fraction": 0.5
                    },
                    {
                        "name": "Early Contributors",
                        "allocation_pct": 20.0,
                        "cliff_months": 6,
                        "vesting_months": 24,
                        "activation_ratio": 0.7,
                        "governance_fraction": 0.1
                    },
                    {
                        "name": "Liquidity Mining",
                        "allocation_pct": 15.0,
                        "cliff_months": 0,
                        "vesting_months": 36,
                        "activation_ratio": 1.0,
                        "governance_fraction": 0.0
                    }
                ],
                "stochastic": False,
                "noise_std_pct": 0.05,
                "seed": 42,
                "annual_discount_rate": 0.10,
                "clip_to_total": True
            }
        }
    ]
    
    return presets
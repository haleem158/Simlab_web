"""Plain-language reading that comes back with every simulation result."""
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Tone = Literal["good", "watch", "risk", "info"]


class ReadingSection(BaseModel):
    key: Literal["drivers", "thresholds", "timing", "inputs"]
    title: str
    items: List[str]


class InputFlag(BaseModel):
    name: str
    value: str
    status: Literal["set", "default"] = Field(
        ..., description="'default' means the value equals the page or model starting value"
    )


class Reading(BaseModel):
    """What a result means, written from the numbers by fixed rules (no AI wording)."""
    headline: str
    tone: Tone = "info"
    sections: List[ReadingSection] = Field(default_factory=list)
    inputs: List[InputFlag] = Field(default_factory=list)
    next_test: Optional[str] = None
    caveats: List[str] = Field(default_factory=list)

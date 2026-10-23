from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class ContactForm(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    company: Optional[str] = None
    services: List[str] = Field(default_factory=list)
    budget: Optional[str] = "Undisclosed"
    brief: str = Field(..., min_length=5, max_length=2000)

class LeadRecord(ContactForm):
    id: str
    created_at: datetime
    status: str = "new"

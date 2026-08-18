from pydantic import BaseModel, Field

class ItemCreate(BaseModel):
    name: str = Field(min_length=1)




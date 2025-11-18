from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class IdentityInformation(BaseModel):
    passportName: str
    nationality: str
    idType: str
    idNumber: str
    gender: str
    dateOfBirth: str


class InfluencerInformation(BaseModel):
    accountIntroduction: str
    profileUrl: str
    followerCount: str
    otherPlatforms: Optional[str] = None


class CareerApplicationData(BaseModel):
    position: str
    positionId: str
    applicantEmail: EmailStr
    submittedAt: str
    identityInformation: IdentityInformation
    influencerInformation: InfluencerInformation


class CareerApplicationResponse(BaseModel):
    success: bool
    message: str
    application_id: Optional[str] = None
    stored_in_database: bool = False

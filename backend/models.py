from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# User Authentication Models
class UserRole(str, Enum):
    DOCTOR = "doctor"
    ADMIN = "admin"
    PHARMACIST = "pharmacist"

class SpecializationEnum(str, Enum):
    INTERNAL_MEDICINE = "Internal Medicine"
    GENERAL_SURGERY = "General Surgery"
    CARDIOLOGY = "Cardiology"
    NEUROLOGY = "Neurology"
    ORTHOPEDICS = "Orthopedics"
    PEDIATRICS = "Pediatrics"
    GYNECOLOGY = "Gynecology"
    DERMATOLOGY = "Dermatology"
    PSYCHIATRY = "Psychiatry"
    EMERGENCY_MEDICINE = "Emergency Medicine"
    FAMILY_MEDICINE = "Family Medicine"
    ANESTHESIOLOGY = "Anesthesiology"
    RADIOLOGY = "Radiology"
    PATHOLOGY = "Pathology"
    OTHER = "Other"

class DoctorRegistration(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    degree: str = Field(..., min_length=2, max_length=100)
    registration_number: str = Field(..., min_length=3, max_length=50)
    organization: str = Field(..., min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    specialization: Optional[SpecializationEnum] = None
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    name: str
    degree: str
    registration_number: str
    organization: str
    email: Optional[str]
    phone: Optional[str]
    specialization: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    medical_license_verified: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Medical Models
class MedicationFormulation(str, Enum):
    TABLET = "Tablet"
    CAPSULE = "Capsule"
    SYRUP = "Syrup"
    SUSPENSION = "Suspension"
    INJECTION = "Injection"
    CREAM = "Cream"
    OINTMENT = "Ointment"
    DROPS = "Drops"
    INHALER = "Inhaler"
    PATCH = "Patch"
    GEL = "Gel"
    LOTION = "Lotion"
    POWDER = "Powder"
    SOLUTION = "Solution"
    SUPPOSITORY = "Suppository"
    SPRAY = "Spray"

class MedicationRoute(str, Enum):
    ORAL = "Oral"
    INTRAVENOUS = "Intravenous"
    INTRAMUSCULAR = "Intramuscular"
    SUBCUTANEOUS = "Subcutaneous"
    TOPICAL = "Topical"
    SUBLINGUAL = "Sublingual"
    RECTAL = "Rectal"
    VAGINAL = "Vaginal"
    INHALATION = "Inhalation"
    NASOGASTRIC = "Nasogastric"

class FoodInstruction(str, Enum):
    BEFORE_MEALS = "Before meals"
    AFTER_MEALS = "After meals"
    WITH_FOOD = "With food"
    WITHOUT_FOOD = "Without food"
    ON_EMPTY_STOMACH = "On empty stomach"
    BEFORE_BREAKFAST = "Before breakfast"
    AFTER_BREAKFAST = "After breakfast"
    BEFORE_LUNCH = "Before lunch"
    AFTER_LUNCH = "After lunch"
    BEFORE_DINNER = "Before dinner"
    AFTER_DINNER = "After dinner"

class Medication(BaseModel):
    name: str
    dosage: str
    formulation: MedicationFormulation
    route: MedicationRoute
    frequency: str
    food_instruction: FoodInstruction
    duration: str

class PatientInfo(BaseModel):
    name: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    blood_pressure: Optional[str] = None
    temperature: Optional[str] = None
    heart_rate: Optional[str] = None
    respiratory_rate: Optional[str] = None
    oxygen_saturation: Optional[str] = None

class MedicalHistory(BaseModel):
    allergies: Optional[str] = None
    past_medical_history: Optional[str] = None
    past_medications: Optional[str] = None
    family_history: Optional[str] = None
    smoking_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    drug_use: Optional[str] = None
    exercise_level: Optional[str] = None

class Prescription(BaseModel):
    id: Optional[str] = None
    doctor_id: str
    patient_info: PatientInfo
    medical_history: MedicalHistory
    diagnosis: str
    medications: List[Medication]
    prognosis: str
    transcript: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class PrescriptionResponse(BaseModel):
    id: str
    prescription: Prescription
    created_at: datetime
    updated_at: datetime

# Drug Database Models
class DrugInteraction(BaseModel):
    type: str  # "drug-drug", "drug-food", "contraindication"
    severity: str  # "critical", "high", "moderate", "low"
    description: str
    warning: str

class DrugInfo(BaseModel):
    name: str
    drug_class: str
    interactions: List[str]
    food_interactions: List[str]
    warnings: str
    contraindications: List[str]
    side_effects: List[str]

# Response Models
class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None
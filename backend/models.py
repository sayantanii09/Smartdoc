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

# EHR Integration Models
class EHRProvider(str, Enum):
    EPIC = "Epic"
    CERNER = "Cerner"
    ALLSCRIPTS = "Allscripts"
    ATHENAHEALTH = "AthenaHealth"
    ECLINICALWORKS = "eClinicalWorks"
    NEXTGEN = "NextGen"
    CUSTOM_FHIR = "Custom FHIR"
    OTHER = "Other"

class EHRConnectionStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    TESTING = "testing"
    ERROR = "error"

class EHRConfiguration(BaseModel):
    provider: EHRProvider
    base_url: str = Field(..., description="Base URL of the EHR FHIR endpoint")
    client_id: Optional[str] = Field(None, description="OAuth2 Client ID")
    client_secret: Optional[str] = Field(None, description="OAuth2 Client Secret")
    auth_url: Optional[str] = Field(None, description="OAuth2 Authorization URL")
    token_url: Optional[str] = Field(None, description="OAuth2 Token URL")
    scope: Optional[str] = Field("patient/*.read patient/*.write", description="FHIR scopes")
    use_oauth: bool = Field(True, description="Whether to use OAuth2 authentication")
    api_key: Optional[str] = Field(None, description="API Key for non-OAuth authentication")
    organization_id: Optional[str] = Field(None, description="Organization identifier in EHR system")
    facility_id: Optional[str] = Field(None, description="Facility identifier in EHR system")
    timeout: int = Field(30, description="Request timeout in seconds")
    verify_ssl: bool = Field(True, description="Verify SSL certificates")

class EHRConnectionTest(BaseModel):
    provider: EHRProvider
    status: EHRConnectionStatus
    message: str
    response_time: Optional[float] = None
    last_tested: datetime
    capabilities: Optional[List[str]] = None
    fhir_version: Optional[str] = None

class EHRSubmission(BaseModel):
    prescription_id: str
    ehr_provider: EHRProvider
    patient_fhir_id: Optional[str] = Field(None, description="Patient ID in EHR system")
    encounter_fhir_id: Optional[str] = Field(None, description="Encounter ID in EHR system")
    submission_data: dict = Field(..., description="FHIR bundle data submitted to EHR")
    metadata: Optional[dict] = Field(None, description="Additional submission metadata")

class EHRSubmissionResponse(BaseModel):
    id: str
    submission: EHRSubmission
    status: str  # "pending", "success", "failed", "retry"
    ehr_response: Optional[dict] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    submitted_at: datetime
    completed_at: Optional[datetime] = None

class FHIRPatient(BaseModel):
    resourceType: str = "Patient"
    id: Optional[str] = None
    identifier: List[dict] = Field(default_factory=list)
    active: bool = True
    name: List[dict] = Field(default_factory=list)
    telecom: List[dict] = Field(default_factory=list)
    gender: Optional[str] = None
    birthDate: Optional[str] = None
    address: List[dict] = Field(default_factory=list)

class FHIRPractitioner(BaseModel):
    resourceType: str = "Practitioner"
    id: Optional[str] = None
    identifier: List[dict] = Field(default_factory=list)
    active: bool = True
    name: List[dict] = Field(default_factory=list)
    telecom: List[dict] = Field(default_factory=list)
    qualification: List[dict] = Field(default_factory=list)

class FHIRMedicationRequest(BaseModel):
    resourceType: str = "MedicationRequest"
    id: Optional[str] = None
    status: str = "active"
    intent: str = "order"
    medicationCodeableConcept: dict
    subject: dict  # Reference to Patient
    requester: dict  # Reference to Practitioner
    dosageInstruction: List[dict] = Field(default_factory=list)
    authoredOn: Optional[str] = None
    note: List[dict] = Field(default_factory=list)

class FHIREncounter(BaseModel):
    resourceType: str = "Encounter"
    id: Optional[str] = None
    status: str = "finished"
    class_: dict = Field(alias="class")
    subject: dict  # Reference to Patient
    participant: List[dict] = Field(default_factory=list)
    period: dict
    reasonCode: List[dict] = Field(default_factory=list)

class FHIRObservation(BaseModel):
    resourceType: str = "Observation"
    id: Optional[str] = None
    status: str = "final"
    category: List[dict] = Field(default_factory=list)
    code: dict
    subject: dict  # Reference to Patient
    encounter: Optional[dict] = None
    effectiveDateTime: Optional[str] = None
    valueQuantity: Optional[dict] = None
    valueString: Optional[str] = None
    component: List[dict] = Field(default_factory=list)

class FHIRBundle(BaseModel):
    resourceType: str = "Bundle"
    id: Optional[str] = None
    type: str = "transaction"
    timestamp: Optional[str] = None
    entry: List[dict] = Field(default_factory=list)
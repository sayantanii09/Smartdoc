import os
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import local modules
from models import (
    DoctorRegistration, UserLogin, UserResponse, TokenResponse,
    Prescription, PrescriptionResponse, StandardResponse, ErrorResponse,
    Medication, PatientInfo, MedicalHistory,
    EHRConfiguration, EHRSubmission, EHRConnectionTest, EHRProvider, EHRConnectionStatus,
    Patient, Visit, SavedPatient, PatientSearchRequest, VisitSearchRequest,
    NewPatientRequest, ExistingPatientVisitRequest, PatientSearchResponse, PatientWithVisitsResponse,
    MedicationTemplate, TemplateSaveRequest, TemplateSearchRequest,
    VoiceCorrection
)
from database import MongoDB, user_db, prescription_db, drug_db, ehr_db, patient_storage_db, medication_template_db
from auth import auth_handler, get_current_user, get_current_user_id, validate_password_strength
from ehr_service import EHRIntegrationService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
# Demo accounts for development and testing
DEMO_DOCTORS = [
    {
        "username": "drsmith",
        "password": "password123",
        "name": "Dr. John Smith",
        "email": "john.smith@hospital.com",
        "phone": "+1-555-0101",
        "degree": "MBBS, MD (Internal Medicine)",
        "registration_number": "MED12345",
        "organization": "City General Hospital",
        "specialization": "Internal Medicine"
    },
    {
        "username": "drjohnson", 
        "password": "password123",
        "name": "Dr. Sarah Johnson",
        "email": "sarah.johnson@medcenter.com",
        "phone": "+1-555-0102",
        "degree": "MBBS, MS (Surgery)",
        "registration_number": "MED67890",
        "organization": "Metropolitan Medical Center",
        "specialization": "General Surgery"
    }
]

async def create_demo_accounts():
    """Create demo accounts if they don't exist in the database"""
    try:
        for demo_doctor in DEMO_DOCTORS:
            # Check if user already exists
            existing_user = await user_db.get_user_by_username(demo_doctor["username"])
            
            if not existing_user:
                # Hash the password
                hashed_password = auth_handler.get_password_hash(demo_doctor["password"])
                
                # Create user document
                user_doc = {
                    "username": demo_doctor["username"],
                    "password_hash": hashed_password,
                    "name": demo_doctor["name"],
                    "email": demo_doctor["email"],
                    "phone": demo_doctor["phone"],
                    "degree": demo_doctor["degree"],
                    "registration_number": demo_doctor["registration_number"],
                    "organization": demo_doctor["organization"],
                    "specialization": demo_doctor["specialization"],
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc),
                    "last_login": None
                }
                
                # Insert into database
                result = await user_db.create_user(user_doc)
                logger.info(f"✅ Demo account created: {demo_doctor['username']}")
            else:
                logger.info(f"Demo account already exists: {demo_doctor['username']}")
                
    except Exception as e:
        logger.error(f"Error creating demo accounts: {e}")

# Database lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Shrutapex Backend Server...")
    try:
        # Connect to MongoDB
        await MongoDB.connect_db()
        
        # Initialize database instances
        await user_db.init_db()
        await prescription_db.init_db() 
        await drug_db.init_db()
        await ehr_db.init_db()
        await patient_storage_db.init_db()
        await medication_template_db.init_db()
        
        # Create demo accounts if they don't exist
        await create_demo_accounts()
        
        logger.info("✅ Database connections established successfully")
        logger.info("✅ Shrutapex Backend Server started successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        raise e
    
    yield
    
    # Shutdown
    logger.info("Shutting down SmartDoc Pro Backend Server...")
    await MongoDB.close_db()
    logger.info("✅ SmartDoc Pro Backend Server shut down successfully")

# Create FastAPI app
app = FastAPI(
    title="SmartDoc Pro API",
    description="Professional Medical Documentation System - Backend API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = [
    "http://localhost:3000",
    "https://meditranscribe.preview.emergentagent.com",
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

# Add production domain patterns
app_name = os.getenv("APP_NAME", "shrutapex")
if app_name:
    allowed_origins.extend([
        f"https://{app_name}.emergent.host",
        f"https://{app_name}-prod.emergent.host",
        f"https://meditranscribe.preview.emergentagent.com"
    ])

# Get additional origins from environment
env_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
allowed_origins.extend([origin.strip() for origin in env_origins if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SmartDoc Pro Backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# Authentication Endpoints
@app.post("/api/auth/register", response_model=StandardResponse)
async def register_doctor(registration: DoctorRegistration):
    """Register a new doctor account"""
    try:
        # Validate password strength
        if not validate_password_strength(registration.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )
        
        # Hash password
        password_hash = auth_handler.get_password_hash(registration.password)
        
        # Prepare user data
        user_data = {
            "username": registration.username,
            "password_hash": password_hash,
            "name": registration.name,
            "degree": registration.degree,
            "registration_number": registration.registration_number,
            "organization": registration.organization,
            "email": registration.email,
            "phone": registration.phone,
            "specialization": registration.specialization.value if registration.specialization else None
        }
        
        # Create user in database
        user = await user_db.create_user(user_data)
        
        logger.info(f"New doctor registered: {registration.username}")
        
        return StandardResponse(
            success=True,
            message="Account created successfully! You can now login with your credentials.",
            data={"user_id": user["id"], "username": user["username"]}
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during registration"
        )

@app.post("/api/auth/login", response_model=TokenResponse)
async def login_doctor(login_data: UserLogin):
    """Login doctor and return JWT token"""
    try:
        # Get user from database
        user = await user_db.get_user_by_username(login_data.username)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Verify password
        if not auth_handler.verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if user is active
        if not user.get("is_active", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Please contact administrator."
            )
        
        # Update last login
        await user_db.update_last_login(login_data.username)
        
        # Create access token
        access_token = auth_handler.encode_token(user["id"], user["username"])
        
        # Remove password hash from response
        user_response = {k: v for k, v in user.items() if k != "password_hash"}
        
        logger.info(f"Doctor logged in: {login_data.username}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(**user_response)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information"""
    return UserResponse(**current_user)

@app.post("/api/auth/logout", response_model=StandardResponse)
async def logout_doctor(current_user: dict = Depends(get_current_user)):
    """Logout doctor (invalidate token - handled on frontend)"""
    logger.info(f"Doctor logged out: {current_user['username']}")
    return StandardResponse(
        success=True,
        message="Successfully logged out"
    )

# Prescription Endpoints
@app.post("/api/prescriptions", response_model=StandardResponse)
async def create_prescription(
    prescription: Prescription,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a new prescription"""
    try:
        # Set doctor ID
        prescription.doctor_id = current_user_id
        
        # Convert to dict for database storage
        prescription_data = prescription.model_dump()
        
        # Create prescription in database
        created_prescription = await prescription_db.create_prescription(prescription_data)
        
        logger.info(f"Prescription created by doctor: {current_user_id}")
        
        return StandardResponse(
            success=True,
            message="Prescription created successfully",
            data={
                "prescription_id": created_prescription["id"],
                "created_at": created_prescription["created_at"].isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Error creating prescription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating prescription"
        )

@app.get("/api/prescriptions", response_model=List[PrescriptionResponse])
async def get_doctor_prescriptions(
    skip: int = 0,
    limit: int = 50,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get prescriptions for current doctor"""
    try:
        prescriptions = await prescription_db.get_prescriptions_by_doctor(
            current_user_id, skip, limit
        )
        
        response = []
        for prescription in prescriptions:
            response.append(PrescriptionResponse(
                id=prescription["id"],
                prescription=Prescription(**prescription),
                created_at=prescription["created_at"],
                updated_at=prescription["updated_at"]
            ))
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting prescriptions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving prescriptions"
        )

@app.get("/api/prescriptions/{prescription_id}")
async def get_prescription(
    prescription_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get specific prescription by ID"""
    try:
        prescription = await prescription_db.get_prescription_by_id(prescription_id)
        
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        # Verify ownership
        if prescription["doctor_id"] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return PrescriptionResponse(
            id=prescription["id"],
            prescription=Prescription(**prescription),
            created_at=prescription["created_at"],
            updated_at=prescription["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prescription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving prescription"
        )

# Drug Database Endpoints
@app.get("/api/drugs/search")
async def search_drugs(
    query: str,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Search drugs in database"""
    try:
        drugs = await drug_db.search_drugs(query, limit)
        return {
            "success": True,
            "data": drugs,
            "count": len(drugs)
        }
    except Exception as e:
        logger.error(f"Error searching drugs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching drugs"
        )

@app.get("/api/drugs/{drug_name}")
async def get_drug_info(
    drug_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed drug information"""
    try:
        drug_info = await drug_db.get_drug_info(drug_name)
        
        if not drug_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Drug not found in database"
            )
        
        return {
            "success": True,
            "data": drug_info
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting drug info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving drug information"
        )

@app.post("/api/drugs/check-interactions")
async def check_drug_interactions(
    drug_names: List[str],
    current_user: dict = Depends(get_current_user)
):
    """Check for drug interactions"""
    try:
        interactions = await drug_db.check_interactions(drug_names)
        
        return {
            "success": True,
            "data": {
                "drugs_checked": drug_names,
                "interactions": interactions,
                "interaction_count": len(interactions)
            }
        }
    except Exception as e:
        logger.error(f"Error checking interactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking drug interactions"
        )

# Medical Database Stats
@app.get("/api/stats/database")
async def get_database_stats(current_user: dict = Depends(get_current_user)):
    """Get medical database statistics"""
    try:
        # Get drug count
        drug_count = await drug_db.db.drug_database.count_documents({})
        
        # Get prescription count for current doctor
        prescription_count = await prescription_db.db.prescriptions.count_documents(
            {"doctor_id": current_user["id"]}
        )
        
        # Get total users count (for admin users)
        total_doctors = await user_db.db.users.count_documents({"role": "doctor"})
        
        return {
            "success": True,
            "data": {
                "total_drugs": drug_count,
                "my_prescriptions": prescription_count,
                "total_doctors": total_doctors,
                "database_status": "operational",
                "last_updated": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving database statistics"
        )

# EHR Integration Endpoints
@app.get("/api/ehr/providers")
async def get_ehr_providers(current_user: dict = Depends(get_current_user)):
    """Get list of supported EHR providers"""
    try:
        async with EHRIntegrationService() as ehr_service:
            providers = ehr_service.get_supported_providers()
            
        return StandardResponse(
            success=True,
            message="EHR providers retrieved successfully",
            data={"providers": providers}
        )
    except Exception as e:
        logger.error(f"Error getting EHR providers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving EHR providers"
        )

@app.post("/api/ehr/configure", response_model=StandardResponse)
async def configure_ehr(
    config: EHRConfiguration,
    current_user_id: str = Depends(get_current_user_id)
):
    """Configure EHR system for current doctor"""
    try:
        # Save configuration
        saved_config = await ehr_db.save_ehr_configuration(current_user_id, config)
        
        logger.info(f"EHR configured for doctor {current_user_id}: {config.provider}")
        
        return StandardResponse(
            success=True,
            message="EHR configuration saved successfully",
            data={
                "config_id": saved_config["id"],
                "provider": config.provider.value
            }
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error configuring EHR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving EHR configuration"
        )

@app.get("/api/ehr/configurations")
async def get_ehr_configurations(current_user_id: str = Depends(get_current_user_id)):
    """Get EHR configurations for current doctor"""
    try:
        configurations = await ehr_db.get_ehr_configurations(current_user_id)
        
        return StandardResponse(
            success=True,
            message="EHR configurations retrieved successfully",
            data={"configurations": configurations}
        )
    except Exception as e:
        logger.error(f"Error getting EHR configurations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving EHR configurations"
        )

@app.post("/api/ehr/test-connection")
async def test_ehr_connection(
    config: EHRConfiguration,
    current_user_id: str = Depends(get_current_user_id)
):
    """Test connection to EHR system"""
    try:
        async with EHRIntegrationService() as ehr_service:
            test_result = await ehr_service.test_ehr_connection(config)
        
        # Save test result
        await ehr_db.save_ehr_connection_test(current_user_id, test_result)
        
        return StandardResponse(
            success=test_result.status == EHRConnectionStatus.CONNECTED,
            message=test_result.message,
            data={
                "status": test_result.status.value,
                "response_time": test_result.response_time,
                "capabilities": test_result.capabilities,
                "fhir_version": test_result.fhir_version
            }
        )
    except Exception as e:
        logger.error(f"Error testing EHR connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error testing EHR connection"
        )

@app.post("/api/ehr/submit-prescription")
async def submit_prescription_to_ehr(
    prescription_id: str,
    provider: EHRProvider,
    current_user: dict = Depends(get_current_user)
):
    """Submit prescription to EHR system"""
    try:
        current_user_id = current_user["id"]
        
        # Get prescription
        prescription_data = await prescription_db.get_prescription_by_id(prescription_id)
        if not prescription_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        # Verify ownership
        if prescription_data["doctor_id"] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get EHR configuration
        config_data = await ehr_db.get_ehr_configuration_by_provider(
            current_user_id, 
            provider.value
        )
        if not config_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"EHR configuration not found for {provider.value}"
            )
        
        config = EHRConfiguration(**config_data)
        prescription = Prescription(**prescription_data)
        
        # Create submission record
        submission = EHRSubmission(
            prescription_id=prescription_id,
            ehr_provider=provider,
            submission_data={},  # Will be filled after submission
            metadata={"submitted_by": current_user_id}
        )
        
        saved_submission = await ehr_db.save_ehr_submission(current_user_id, submission)
        submission_id = saved_submission["id"]
        
        # Submit to EHR
        async with EHRIntegrationService() as ehr_service:
            submission_result = await ehr_service.submit_prescription_to_ehr(
                prescription, 
                current_user,
                config
            )
        
        # Update submission status
        if submission_result["success"]:
            await ehr_db.update_ehr_submission_status(
                submission_id,
                "success",
                ehr_response=submission_result["response"],
            )
            
            # Update submission with FHIR IDs
            if submission_result.get("patient_fhir_id"):
                await ehr_db.db[ehr_db.ehr_submissions_collection].update_one(
                    {"id": submission_id},
                    {"$set": {
                        "patient_fhir_id": submission_result["patient_fhir_id"],
                        "encounter_fhir_id": submission_result.get("encounter_fhir_id"),
                        "submission_data": submission_result["submitted_bundle"]
                    }}
                )
            
            return StandardResponse(
                success=True,
                message="Prescription submitted to EHR successfully",
                data={
                    "submission_id": submission_id,
                    "ehr_provider": provider.value,
                    "patient_fhir_id": submission_result.get("patient_fhir_id"),
                    "status_code": submission_result["status_code"]
                }
            )
        else:
            await ehr_db.update_ehr_submission_status(
                submission_id,
                "failed",
                error_message=submission_result.get("error", "Unknown error")
            )
            
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"EHR submission failed: {submission_result.get('error', 'Unknown error')}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting prescription to EHR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error submitting prescription to EHR"
        )

@app.get("/api/ehr/submissions")
async def get_ehr_submissions(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get EHR submission history for current doctor"""
    try:
        submissions = await ehr_db.get_ehr_submissions(
            current_user_id, 
            skip, 
            limit, 
            status
        )
        
        return StandardResponse(
            success=True,
            message="EHR submissions retrieved successfully",
            data={
                "submissions": submissions,
                "count": len(submissions)
            }
        )
    except Exception as e:
        logger.error(f"Error getting EHR submissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving EHR submissions"
        )

@app.get("/api/ehr/submissions/{submission_id}")
async def get_ehr_submission_details(
    submission_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get detailed information about a specific EHR submission"""
    try:
        submission = await ehr_db.get_ehr_submission_by_id(submission_id)
        
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        # Verify ownership
        if submission["doctor_id"] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return StandardResponse(
            success=True,
            message="Submission details retrieved successfully",
            data={"submission": submission}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting submission details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving submission details"
        )

@app.delete("/api/ehr/configurations/{config_id}")
async def delete_ehr_configuration(
    config_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete EHR configuration"""
    try:
        deleted = await ehr_db.delete_ehr_configuration(current_user_id, config_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuration not found"
            )
        
        return StandardResponse(
            success=True,
            message="EHR configuration deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting EHR configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting EHR configuration"
        )

# Patient Storage Endpoints
@app.post("/api/patients/save", response_model=StandardResponse)
async def save_patient(
    patient_info: PatientInfo,
    medical_history: MedicalHistory,
    diagnosis: Optional[str] = None,
    prognosis: Optional[str] = None,
    notes: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """Save patient information with unique code"""
    try:
        result = await patient_storage_db.save_patient(
            doctor_id=current_user_id,
            patient_info=patient_info,
            medical_history=medical_history,
            diagnosis=diagnosis,
            prognosis=prognosis,
            notes=notes
        )
        
        return StandardResponse(
            success=True,
            message="Patient saved successfully",
            data={
                "patient_code": result["patient_code"],
                "id": result["id"],
                "visit_date": result["visit_date"].isoformat()
            }
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error saving patient: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving patient information"
        )

@app.post("/api/patients/search", response_model=StandardResponse)
async def search_patient(
    search_request: PatientSearchRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Search patient by unique code"""
    try:
        patient = await patient_storage_db.get_patient_by_code(search_request.patient_code)
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found with the provided code"
            )
        
        # Verify access - either same doctor or public patient
        if patient["doctor_id"] != current_user_id:
            # Add logic here if you want to allow cross-doctor access for specific cases
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this patient record"
            )
        
        return StandardResponse(
            success=True,
            message="Patient found successfully",
            data={"patient": patient}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching patient: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching patient"
        )

@app.get("/api/patients/my-patients")
async def get_my_patients(
    skip: int = 0,
    limit: int = 50,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all patients for current doctor"""
    try:
        patients = await patient_storage_db.get_patients_by_doctor(
            doctor_id=current_user_id,
            skip=skip,
            limit=limit
        )
        
        return StandardResponse(
            success=True,
            message="Patients retrieved successfully",
            data={
                "patients": patients,
                "count": len(patients)
            }
        )
    except Exception as e:
        logger.error(f"Error getting patients: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving patients"
        )

# ============ NEW PATIENT MANAGEMENT SYSTEM ============

@app.post("/api/patients/search-patients", response_model=PatientSearchResponse)
async def search_patients(
    search_request: PatientSearchRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Search for existing patients by name, MRN, or phone"""
    try:
        patients = await patient_storage_db.search_patients(
            search_term=search_request.search_term,
            doctor_id=current_user_id
        )
        
        return PatientSearchResponse(
            patients=patients,
            total_count=len(patients)
        )
        
    except Exception as e:
        logger.error(f"Error searching patients: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching patients"
        )

@app.post("/api/patients/create-new", response_model=StandardResponse)
async def create_new_patient(
    patient_request: NewPatientRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create new patient with initial visit"""
    try:
        result = await patient_storage_db.create_patient(
            doctor_id=current_user_id,
            patient_info=patient_request.patient_info.dict(),
            medical_history=patient_request.medical_history.dict(),
            diagnosis=patient_request.diagnosis,
            prognosis=patient_request.prognosis,
            notes=patient_request.notes
        )
        
        return StandardResponse(
            success=True,
            message="New patient created successfully",
            data={
                "mrn": result["mrn"],
                "visit_code": result["visit_code"],
                "patient_name": result["patient"]["patient_info"]["name"]
            }
        )
        
    except Exception as e:
        logger.error(f"Error creating new patient: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating new patient"
        )

@app.post("/api/patients/add-visit", response_model=StandardResponse)
async def add_visit_to_existing_patient(
    visit_request: ExistingPatientVisitRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Add new visit to existing patient"""
    try:
        result = await patient_storage_db.create_visit(
            patient_mrn=visit_request.patient_mrn,
            doctor_id=current_user_id,
            medical_history=visit_request.medical_history.dict(),
            diagnosis=visit_request.diagnosis,
            prognosis=visit_request.prognosis,
            notes=visit_request.notes,
            visit_type="follow_up"
        )
        
        return StandardResponse(
            success=True,
            message="Visit added successfully",
            data={
                "visit_code": result["visit_code"],
                "patient_mrn": visit_request.patient_mrn
            }
        )
        
    except Exception as e:
        logger.error(f"Error adding visit: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding visit to patient"
        )

@app.get("/api/patients/{mrn}/details", response_model=PatientWithVisitsResponse)
async def get_patient_details(
    mrn: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get patient details with all visits"""
    try:
        result = await patient_storage_db.get_patient_with_visits(mrn)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        return PatientWithVisitsResponse(
            patient=result["patient"],
            visits=result["visits"],
            visit_count=result["visit_count"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving patient details"
        )

@app.post("/api/visits/search", response_model=StandardResponse)
async def search_visit_by_code(
    search_request: VisitSearchRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Search visit by visit code"""
    try:
        result = await patient_storage_db.get_visit_by_code(search_request.visit_code)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Visit not found"
            )
        
        return StandardResponse(
            success=True,
            message="Visit found",
            data={
                "visit": result["visit"],
                "patient": result["patient"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching visit: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching visit"
        )

# ============ LEGACY ENDPOINTS (for backward compatibility) ============
# Medication Template Endpoints
@app.post("/api/templates/save", response_model=StandardResponse)
async def save_medication_template(
    template_request: TemplateSaveRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Save medication template for a disease"""
    try:
        medications_data = [med.model_dump() for med in template_request.medications]
        
        result = await medication_template_db.save_template(
            doctor_id=current_user_id,
            name=template_request.name,
            disease_condition=template_request.disease_condition,
            medications=medications_data,
            description=template_request.description,
            is_public=template_request.is_public
        )
        
        return StandardResponse(
            success=True,
            message="Medication template saved successfully",
            data={
                "template_id": result["id"],
                "name": result["name"],
                "disease_condition": result["disease_condition"]
            }
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error saving medication template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving medication template"
        )

@app.post("/api/templates/search")
async def search_medication_templates(
    search_request: TemplateSearchRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Search medication templates by disease condition"""
    try:
        templates = await medication_template_db.get_templates_by_condition(
            doctor_id=current_user_id,
            disease_condition=search_request.disease_condition
        )
        
        return StandardResponse(
            success=True,
            message="Templates found successfully",
            data={
                "templates": templates,
                "count": len(templates)
            }
        )
    except Exception as e:
        logger.error(f"Error searching templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching medication templates"
        )

@app.post("/api/templates/use/{template_id}")
async def use_medication_template(
    template_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Load medication template and return medications"""
    try:
        template = await medication_template_db.get_template_by_id(template_id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Check access - either owned by user or is public
        if template["doctor_id"] != current_user_id and not template["is_public"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this template"
            )
        
        # Increment usage count
        await medication_template_db.use_template(template_id)
        
        return StandardResponse(
            success=True,
            message="Template loaded successfully",
            data={
                "template": template,
                "medications": template["medications"]
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error using template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error loading medication template"
        )

@app.get("/api/templates/popular")
async def get_popular_templates(limit: int = 10):
    """Get most popular public medication templates"""
    try:
        templates = await medication_template_db.get_popular_templates(limit=limit)
        
        return StandardResponse(
            success=True,
            message="Popular templates retrieved successfully",
            data={
                "templates": templates,
                "count": len(templates)
            }
        )
    except Exception as e:
        logger.error(f"Error getting popular templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving popular templates"
        )

@app.delete("/api/templates/{template_id}")
async def delete_medication_template(
    template_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete medication template"""
    try:
        deleted = await medication_template_db.delete_template(template_id, current_user_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found or access denied"
            )
        
        return StandardResponse(
            success=True,
            message="Medication template deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting medication template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting medication template"
        )

# Error handlers
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "status_code": 500
        }
    )

# Development endpoints (remove in production)
if os.getenv("ENVIRONMENT") == "development":
    @app.get("/api/dev/reset-database")
    async def reset_database():
        """Reset database - DEVELOPMENT ONLY"""
        try:
            # Clear all collections
            await user_db.db.users.delete_many({})
            await prescription_db.db.prescriptions.delete_many({})
            await drug_db.db.drug_database.delete_many({})
            
            # Reinitialize drug database
            await drug_db.initialize_drug_database()
            
            return {"success": True, "message": "Database reset successfully"}
        except Exception as e:
            logger.error(f"Error resetting database: {e}")
            raise HTTPException(status_code=500, detail="Error resetting database")

# ========================
# AI LEARNING - VOICE CORRECTIONS
# ========================

@app.post("/api/voice-corrections", response_model=StandardResponse)
async def save_voice_correction(
    correction: VoiceCorrection,
    user_id: str = Depends(get_current_user_id)
):
    """Save a voice transcription correction for AI learning"""
    try:
        # Access voice_corrections collection
        voice_corrections_db = MongoDB.database.voice_corrections
        
        # Check if this correction already exists
        existing = await voice_corrections_db.find_one({
            "doctor_id": correction.doctor_id,
            "field": correction.field,
            "original": correction.original.lower()
        })
        
        if existing:
            # Increment count and update
            await voice_corrections_db.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "corrected": correction.corrected,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    },
                    "$inc": {"count": 1}
                }
            )
            logger.info(f"Updated voice correction: {correction.original} → {correction.corrected}")
        else:
            # Insert new correction
            correction_dict = correction.dict()
            correction_dict["created_at"] = datetime.now(timezone.utc).isoformat()
            correction_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
            await voice_corrections_db.insert_one(correction_dict)
            logger.info(f"Saved new voice correction: {correction.original} → {correction.corrected}")
        
        return StandardResponse(
            success=True,
            message="Voice correction learned successfully"
        )
    except Exception as e:
        logger.error(f"Error saving voice correction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/voice-corrections")
async def get_voice_corrections(
    doctor_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get all learned voice corrections for a doctor"""
    try:
        # Access voice_corrections collection
        voice_corrections_db = MongoDB.database.voice_corrections
        corrections = await voice_corrections_db.find({"doctor_id": doctor_id}).to_list(length=None)
        
        # Format corrections into a structured dict for frontend
        formatted = {}
        for correction in corrections:
            field = correction["field"]
            if field not in formatted:
                formatted[field] = {}
            formatted[field][correction["original"].lower()] = correction["corrected"]
        
        logger.info(f"Retrieved {len(corrections)} voice corrections for doctor {doctor_id}")
        return formatted
    except Exception as e:
        logger.error(f"Error retrieving voice corrections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False,
        log_level="info"
    )
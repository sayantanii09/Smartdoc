import os
import logging
from datetime import datetime
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
    EHRConfiguration, EHRSubmission, EHRConnectionTest, EHRProvider
)
from database import MongoDB, user_db, prescription_db, drug_db, ehr_db
from auth import auth_handler, get_current_user, get_current_user_id, validate_password_strength
from ehr_service import EHRIntegrationService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting SmartDoc Pro Backend Server...")
    try:
        # Connect to MongoDB
        await MongoDB.connect_db()
        
        # Initialize database instances
        await user_db.init_db()
        await prescription_db.init_db() 
        await drug_db.init_db()
        await ehr_db.init_db()
        
        logger.info("✅ Database connections established successfully")
        logger.info("✅ SmartDoc Pro Backend Server started successfully")
        
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
    "https://healthscribe-3.preview.emergentagent.com",
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False,
        log_level="info"
    )
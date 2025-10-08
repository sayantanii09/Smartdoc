"""
Patient Storage and Medication Template System
Handles saving/retrieving patient information and medication templates
"""

import uuid
import random
import string
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict

from database import MongoDB
from models import SavedPatient, MedicationTemplate, PatientInfo, MedicalHistory

logger = logging.getLogger(__name__)

class PatientStorageDB:
    """Database operations for patient storage system"""
    
    def __init__(self):
        self.db = None
        self.patients_collection = "patients_new"  # Core patient records
        self.visits_collection = "visits"  # Visit records linked to patients
        self.legacy_patients_collection = "saved_patients"  # Legacy saved patients
        self.templates_collection = "medication_templates"
    
    async def init_db(self):
        """Initialize database connection"""
        self.db = MongoDB.database
        await self._create_indexes()
    
    async def _create_indexes(self):
        """Initialize patient storage database and create indexes"""
        try:
            # Core Patient indexes
            await self.db[self.patients_collection].create_index("mrn", unique=True)
            await self.db[self.patients_collection].create_index("created_by_doctor_id")
            await self.db[self.patients_collection].create_index([
                ("patient_info.name", "text"),
                ("patient_info.phone", "text")
            ])
            await self.db[self.patients_collection].create_index("created_date")
            
            # Visit indexes
            await self.db[self.visits_collection].create_index("visit_code", unique=True)
            await self.db[self.visits_collection].create_index("patient_mrn")
            await self.db[self.visits_collection].create_index("doctor_id")
            await self.db[self.visits_collection].create_index("visit_date")
            await self.db[self.visits_collection].create_index("visit_type")
            
            # Legacy patient indexes (maintain compatibility)
            await self.db[self.legacy_patients_collection].create_index("doctor_id")
            await self.db[self.legacy_patients_collection].create_index("patient_code", unique=True)
            await self.db[self.legacy_patients_collection].create_index("visit_date")
            
            # Medication template indexes
            await self.db[self.templates_collection].create_index("doctor_id")
            await self.db[self.templates_collection].create_index("disease_condition")
            await self.db[self.templates_collection].create_index("name")
            await self.db[self.templates_collection].create_index("is_public")
            await self.db[self.templates_collection].create_index("usage_count")
            
        except Exception as e:
            logger.error(f"Error creating patient storage indexes: {e}")
    
    def generate_mrn(self) -> str:
        """Generate unique Medical Record Number (MRN)"""
        # Format: MRN + 7 digits (e.g., MRN1234567)
        digits = ''.join(random.choices(string.digits, k=7))
        return f"MRN{digits}"
    
    # ============ NEW PATIENT MANAGEMENT SYSTEM ============
    
    async def search_patients(self, search_term: str, doctor_id: str = None) -> List[Dict]:
        """Search patients by name, MRN, or phone number"""
        try:
            # Build search query
            query = {"is_active": True}
            
            # If search term provided, add search conditions
            if search_term and search_term.strip():
                query["$or"] = [
                    {"mrn": {"$regex": search_term, "$options": "i"}},
                    {"patient_info.name": {"$regex": search_term, "$options": "i"}},
                    {"patient_info.phone": {"$regex": search_term, "$options": "i"}}
                ]
            
            # If doctor_id specified, limit to patients created by this doctor
            if doctor_id:
                query["created_by_doctor_id"] = doctor_id
            
            cursor = self.db[self.patients_collection].find(query).limit(20)
            patients = []
            
            async for patient in cursor:
                if "_id" in patient:
                    patient["id"] = str(patient["_id"])
                    del patient["_id"]
                
                # Get latest visit info
                latest_visit = await self.db[self.visits_collection].find_one(
                    {"patient_mrn": patient["mrn"]},
                    sort=[("visit_date", -1)]
                )
                
                patient["latest_visit_date"] = latest_visit["visit_date"] if latest_visit else patient["created_date"]
                patient["total_visits"] = await self.db[self.visits_collection].count_documents(
                    {"patient_mrn": patient["mrn"]}
                )
                
                patients.append(patient)
            
            return patients
            
        except Exception as e:
            logger.error(f"Error searching patients: {e}")
            raise Exception(f"Failed to search patients: {str(e)}")
    
    async def create_patient(
        self, 
        doctor_id: str, 
        patient_info: dict,
        medical_history: dict,
        diagnosis: str = None,
        prognosis: str = None,
        notes: str = None
    ) -> Dict:
        """Create new patient record and first visit"""
        try:
            # Generate unique MRN
            mrn = None
            max_attempts = 10
            
            for _ in range(max_attempts):
                candidate_mrn = self.generate_mrn()
                existing = await self.db[self.patients_collection].find_one({
                    "mrn": candidate_mrn
                })
                if not existing:
                    mrn = candidate_mrn
                    break
            
            if not mrn:
                raise Exception("Could not generate unique MRN")
            
            # Create patient record
            now = datetime.now(timezone.utc)
            patient_doc = {
                "mrn": mrn,
                "patient_info": patient_info,
                "created_by_doctor_id": doctor_id,
                "created_date": now,
                "last_updated": now,
                "is_active": True
            }
            
            # Insert patient
            await self.db[self.patients_collection].insert_one(patient_doc)
            
            # Create first visit
            visit_result = await self.create_visit(
                patient_mrn=mrn,
                doctor_id=doctor_id,
                medical_history=medical_history,
                diagnosis=diagnosis,
                prognosis=prognosis,
                notes=notes,
                visit_type="initial_consultation"
            )
            
            return {
                "mrn": mrn,
                "visit_code": visit_result["visit_code"],
                "patient": patient_doc,
                "visit": visit_result["visit"]
            }
            
        except Exception as e:
            logger.error(f"Error creating patient: {e}")
            raise Exception(f"Failed to create patient: {str(e)}")
    
    async def create_visit(
        self,
        patient_mrn: str,
        doctor_id: str,
        medical_history: dict,
        diagnosis: str = None,
        prognosis: str = None,
        medications: List[dict] = None,
        notes: str = None,
        visit_type: str = "consultation"
    ) -> Dict:
        """Create new visit for existing patient"""
        try:
            # Verify patient exists
            patient = await self.db[self.patients_collection].find_one({"mrn": patient_mrn})
            if not patient:
                raise Exception(f"Patient with MRN {patient_mrn} not found")
            
            # Generate unique visit code
            visit_code = None
            max_attempts = 10
            
            for _ in range(max_attempts):
                candidate_code = self.generate_visit_code()
                existing = await self.db[self.visits_collection].find_one({
                    "visit_code": candidate_code
                })
                if not existing:
                    visit_code = candidate_code
                    break
            
            if not visit_code:
                raise Exception("Could not generate unique visit code")
            
            # Create visit record
            now = datetime.now(timezone.utc)
            visit_doc = {
                "visit_code": visit_code,
                "patient_mrn": patient_mrn,
                "doctor_id": doctor_id,
                "visit_date": now,
                "medical_history": medical_history,
                "diagnosis": diagnosis,
                "prognosis": prognosis,
                "medications": medications or [],
                "notes": notes,
                "visit_type": visit_type,
                "is_active": True
            }
            
            # Insert visit
            await self.db[self.visits_collection].insert_one(visit_doc)
            
            # Update patient last_updated
            await self.db[self.patients_collection].update_one(
                {"mrn": patient_mrn},
                {"$set": {"last_updated": now}}
            )
            
            return {
                "visit_code": visit_code,
                "visit": visit_doc
            }
            
        except Exception as e:
            logger.error(f"Error creating visit: {e}")
            raise Exception(f"Failed to create visit: {str(e)}")
    
    async def get_patient_with_visits(self, mrn: str) -> Dict:
        """Get patient record with all visits"""
        try:
            # Get patient
            patient = await self.db[self.patients_collection].find_one({
                "mrn": mrn,
                "is_active": True
            })
            
            if not patient:
                return None
            
            if "_id" in patient:
                patient["id"] = str(patient["_id"])
                del patient["_id"]
            
            # Get all visits for this patient
            cursor = self.db[self.visits_collection].find({
                "patient_mrn": mrn,
                "is_active": True
            }).sort("visit_date", -1)
            
            visits = []
            async for visit in cursor:
                if "_id" in visit:
                    visit["id"] = str(visit["_id"])
                    del visit["_id"]
                visits.append(visit)
            
            return {
                "patient": patient,
                "visits": visits,
                "visit_count": len(visits)
            }
            
        except Exception as e:
            logger.error(f"Error getting patient with visits: {e}")
            raise Exception(f"Failed to get patient with visits: {str(e)}")
    
    async def get_visit_by_code(self, visit_code: str) -> Dict:
        """Get visit by visit code"""
        try:
            visit = await self.db[self.visits_collection].find_one({
                "visit_code": visit_code,
                "is_active": True
            })
            
            if not visit:
                return None
            
            if "_id" in visit:
                visit["id"] = str(visit["_id"])
                del visit["_id"]
            
            # Get associated patient
            patient = await self.db[self.patients_collection].find_one({
                "mrn": visit["patient_mrn"]
            })
            
            if patient and "_id" in patient:
                patient["id"] = str(patient["_id"])
                del patient["_id"]
            
            return {
                "visit": visit,
                "patient": patient
            }
            
        except Exception as e:
            logger.error(f"Error getting visit by code: {e}")
            raise Exception(f"Failed to get visit by code: {str(e)}")
    
    # ============ LEGACY PATIENT CODE SYSTEM (for backward compatibility) ============
    
    def generate_visit_code(self) -> str:
        """Generate unique 6-8 character visit code"""
        # Format: V + 2 letters + 4-5 digits (e.g., VAB1234, VCD56789)
        letters = ''.join(random.choices(string.ascii_uppercase, k=2))
        digits = ''.join(random.choices(string.digits, k=random.choice([4, 5])))
        return f"V{letters}{digits}"
    
    def generate_patient_code(self) -> str:
        """Generate unique 6-8 character patient code (legacy)"""
        # Format: 2 letters + 4-6 digits (e.g., AB1234, CD567890)
        letters = ''.join(random.choices(string.ascii_uppercase, k=2))
        digits = ''.join(random.choices(string.digits, k=random.choice([4, 5, 6])))
        return f"{letters}{digits}"
    
    async def save_patient(
        self, 
        doctor_id: str, 
        patient_info: PatientInfo, 
        medical_history: MedicalHistory,
        diagnosis: str = None,
        prognosis: str = None,
        notes: str = None
    ) -> Dict:
        """Save patient information with unique code"""
        try:
            # Generate unique patient code
            patient_code = None
            max_attempts = 10
            
            for _ in range(max_attempts):
                candidate_code = self.generate_patient_code()
                existing = await self.db[self.patients_collection].find_one({
                    "patient_code": candidate_code
                })
                if not existing:
                    patient_code = candidate_code
                    break
            
            if not patient_code:
                raise ValueError("Unable to generate unique patient code")
            
            patient_data = {
                "id": str(uuid.uuid4()),
                "patient_code": patient_code,
                "patient_info": patient_info.model_dump(),
                "medical_history": medical_history.model_dump(),
                "doctor_id": doctor_id,
                "diagnosis": diagnosis,
                "prognosis": prognosis,
                "visit_date": datetime.now(timezone.utc),
                "last_updated": datetime.now(timezone.utc),
                "notes": notes,
                "is_active": True
            }
            
            await self.db[self.patients_collection].insert_one(patient_data)
            
            logger.info(f"Patient saved with code: {patient_code}")
            return {
                "patient_code": patient_code,
                "id": patient_data["id"],
                "visit_date": patient_data["visit_date"]
            }
            
        except Exception as e:
            logger.error(f"Error saving patient: {e}")
            raise ValueError(f"Failed to save patient: {str(e)}")
    
    async def get_patient_by_code(self, patient_code: str) -> Optional[Dict]:
        """Retrieve patient by unique code"""
        try:
            patient = await self.db[self.patients_collection].find_one({
                "patient_code": patient_code.upper(),
                "is_active": True
            })
            
            if patient and "_id" in patient:
                # Convert MongoDB ObjectId to string and remove _id field
                if "id" not in patient:
                    patient["id"] = str(patient["_id"])
                del patient["_id"]
            
            return patient
            
        except Exception as e:
            logger.error(f"Error retrieving patient by code: {e}")
            return None
    
    async def get_patients_by_doctor(
        self, 
        doctor_id: str, 
        skip: int = 0, 
        limit: int = 50
    ) -> List[Dict]:
        """Get all patients for a doctor"""
        try:
            cursor = self.db[self.patients_collection].find({
                "doctor_id": doctor_id,
                "is_active": True
            }).sort("visit_date", -1).skip(skip).limit(limit)
            
            patients = []
            async for patient in cursor:
                # Convert MongoDB ObjectId to string and remove _id field
                if "_id" in patient:
                    if "id" not in patient:
                        patient["id"] = str(patient["_id"])
                    del patient["_id"]
                patients.append(patient)
            
            return patients
            
        except Exception as e:
            logger.error(f"Error getting patients by doctor: {e}")
            return []
    
    async def update_patient(
        self, 
        patient_code: str, 
        doctor_id: str, 
        updates: Dict
    ) -> bool:
        """Update patient information"""
        try:
            updates["last_updated"] = datetime.now(timezone.utc)
            
            result = await self.db[self.patients_collection].update_one(
                {
                    "patient_code": patient_code.upper(),
                    "doctor_id": doctor_id,
                    "is_active": True
                },
                {"$set": updates}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating patient: {e}")
            return False

class MedicationTemplateDB:
    """Database operations for medication templates"""
    
    def __init__(self):
        self.db = None
        self.templates_collection = "medication_templates"
    
    async def init_db(self):
        """Initialize database connection"""
        self.db = MongoDB.database
    
    async def save_template(
        self, 
        doctor_id: str, 
        name: str, 
        disease_condition: str, 
        medications: List[Dict],
        description: str = None,
        is_public: bool = False
    ) -> Dict:
        """Save medication template"""
        try:
            template_data = {
                "id": str(uuid.uuid4()),
                "name": name,
                "disease_condition": disease_condition.lower(),
                "medications": medications,
                "description": description,
                "doctor_id": doctor_id,
                "is_public": is_public,
                "usage_count": 0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await self.db[self.templates_collection].insert_one(template_data)
            
            logger.info(f"Medication template saved: {name} for {disease_condition}")
            return template_data
            
        except Exception as e:
            logger.error(f"Error saving medication template: {e}")
            raise ValueError(f"Failed to save template: {str(e)}")
    
    async def get_templates_by_condition(
        self, 
        doctor_id: str, 
        disease_condition: str = None
    ) -> List[Dict]:
        """Get medication templates by disease condition"""
        try:
            query = {
                "$or": [
                    {"doctor_id": doctor_id},
                    {"is_public": True}
                ]
            }
            
            if disease_condition:
                query["disease_condition"] = {"$regex": disease_condition.lower(), "$options": "i"}
            
            cursor = self.db[self.templates_collection].find(query).sort([
                ("usage_count", -1),  # Most used first
                ("created_at", -1)    # Then newest
            ])
            
            templates = []
            async for template in cursor:
                templates.append(template)
            
            return templates
            
        except Exception as e:
            logger.error(f"Error getting templates by condition: {e}")
            return []
    
    async def get_template_by_id(self, template_id: str) -> Optional[Dict]:
        """Get specific template by ID"""
        try:
            template = await self.db[self.templates_collection].find_one({
                "id": template_id
            })
            
            return template
            
        except Exception as e:
            logger.error(f"Error getting template by ID: {e}")
            return None
    
    async def use_template(self, template_id: str) -> bool:
        """Increment usage count for template"""
        try:
            result = await self.db[self.templates_collection].update_one(
                {"id": template_id},
                {"$inc": {"usage_count": 1}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error incrementing template usage: {e}")
            return False
    
    async def delete_template(self, template_id: str, doctor_id: str) -> bool:
        """Delete template (only if owned by doctor)"""
        try:
            result = await self.db[self.templates_collection].delete_one({
                "id": template_id,
                "doctor_id": doctor_id
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting template: {e}")
            return False
    
    async def get_popular_templates(self, limit: int = 10) -> List[Dict]:
        """Get most popular public templates"""
        try:
            cursor = self.db[self.templates_collection].find({
                "is_public": True
            }).sort("usage_count", -1).limit(limit)
            
            templates = []
            async for template in cursor:
                templates.append(template)
            
            return templates
            
        except Exception as e:
            logger.error(f"Error getting popular templates: {e}")
            return []

# Global instances
patient_storage_db = PatientStorageDB()
medication_template_db = MedicationTemplateDB()
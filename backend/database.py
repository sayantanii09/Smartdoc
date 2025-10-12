import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timedelta
import logging
from typing import Optional, List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

    @classmethod
    async def connect_db(cls):
        """Create database connection"""
        try:
            mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/smartdoc_pro")
            cls.client = AsyncIOMotorClient(mongo_url)
            
            # Extract database name from URL (handle query parameters)
            if '/' in mongo_url:
                db_part = mongo_url.split('/')[-1]
                # Remove query parameters if present
                db_name = db_part.split('?')[0] if '?' in db_part else db_part
                # Ensure database name is within MongoDB limits (max 63 chars)
                if len(db_name) > 63:
                    db_name = db_name[:63]
                # Fallback to environment variable or default
                db_name = db_name if db_name else os.getenv("DB_NAME", "smartdoc_pro")
            else:
                db_name = os.getenv("DB_NAME", "smartdoc_pro")
            cls.database = cls.client[db_name]
            
            # Test connection
            await cls.client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB")
            logger.info(f"Database name: '{db_name}' (length: {len(db_name)} chars)")
            logger.info(f"MONGO_URL pattern: {mongo_url[:50]}...")
            
            # Test database permissions by trying to list collections
            try:
                collections = await cls.database.list_collection_names()
                logger.info(f"Database '{db_name}' accessible - found {len(collections)} collections")
            except Exception as db_error:
                logger.error(f"Database authorization error for '{db_name}': {db_error}")
                # Try to extract correct database name from MONGO_URL
                logger.info(f"Full MONGO_URL for debugging: {mongo_url}")
                raise Exception(f"Database authorization failed for '{db_name}' - check MONGO_URL and permissions")
            
            # Create indexes for better performance and data integrity
            await cls.create_indexes()
            
        except Exception as e:
            logger.error(f"Could not connect to MongoDB: {e}")
            raise e

    @classmethod
    async def close_db(cls):
        """Close database connection"""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")

    @classmethod
    async def create_indexes(cls):
        """Create database indexes for performance and uniqueness"""
        try:
            # Users collection indexes
            await cls.database.users.create_index("username", unique=True)
            await cls.database.users.create_index("email", unique=True, sparse=True)
            await cls.database.users.create_index("registration_number", unique=True)
            await cls.database.users.create_index([("created_at", -1)])
            
            # Prescriptions collection indexes
            await cls.database.prescriptions.create_index([("doctor_id", 1), ("created_at", -1)])
            await cls.database.prescriptions.create_index([("created_at", -1)])
            await cls.database.prescriptions.create_index("patient_info.name")
            
            # Drug database indexes
            await cls.database.drug_database.create_index("name", unique=True)
            await cls.database.drug_database.create_index("drug_class")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

    @classmethod
    async def get_database(cls):
        """Get database instance"""
        return cls.database

# User Database Operations
class UserDB:
    def __init__(self):
        self.db = None

    async def init_db(self):
        self.db = await MongoDB.get_database()

    async def create_user(self, user_data: dict) -> dict:
        """Create a new user"""
        try:
            user_data["created_at"] = datetime.utcnow()
            user_data["last_login"] = None
            user_data["is_active"] = True
            user_data["role"] = "doctor"
            user_data["medical_license_verified"] = False
            
            result = await self.db.users.insert_one(user_data)
            
            # Retrieve the created user
            user = await self.db.users.find_one({"_id": result.inserted_id})
            user["id"] = str(user["_id"])
            del user["_id"]
            del user["password_hash"]  # Don't return password hash
            
            logger.info(f"User created successfully: {user_data['username']}")
            return user
            
        except DuplicateKeyError as e:
            # Determine which field caused the duplicate error
            if "username" in str(e):
                raise ValueError("Username already exists")
            elif "email" in str(e):
                raise ValueError("Email already exists")
            elif "registration_number" in str(e):
                raise ValueError("Registration number already exists")
            else:
                raise ValueError("Duplicate entry")
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise e

    async def get_user_by_username(self, username: str) -> Optional[dict]:
        """Get user by username"""
        try:
            user = await self.db.users.find_one({"username": username})
            if user:
                user["id"] = str(user["_id"])
                del user["_id"]
            return user
        except Exception as e:
            logger.error(f"Error getting user by username: {e}")
            return None

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        try:
            from bson import ObjectId
            user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                user["id"] = str(user["_id"])
                del user["_id"]
                if "password_hash" in user:
                    del user["password_hash"]  # Don't return password hash
            return user
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None

    async def update_last_login(self, username: str):
        """Update user's last login time"""
        try:
            await self.db.users.update_one(
                {"username": username},
                {"$set": {"last_login": datetime.utcnow()}}
            )
        except Exception as e:
            logger.error(f"Error updating last login: {e}")

    async def get_all_users(self, skip: int = 0, limit: int = 100) -> List[dict]:
        """Get all users with pagination"""
        try:
            cursor = self.db.users.find({}).skip(skip).limit(limit)
            users = []
            async for user in cursor:
                user["id"] = str(user["_id"])
                del user["_id"]
                if "password_hash" in user:
                    del user["password_hash"]
                users.append(user)
            return users
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return []

# Prescription Database Operations
class PrescriptionDB:
    def __init__(self):
        self.db = None

    async def init_db(self):
        self.db = await MongoDB.get_database()

    async def create_prescription(self, prescription_data: dict) -> dict:
        """Create a new prescription"""
        try:
            prescription_data["created_at"] = datetime.utcnow()
            prescription_data["updated_at"] = datetime.utcnow()
            
            result = await self.db.prescriptions.insert_one(prescription_data)
            
            # Retrieve the created prescription
            prescription = await self.db.prescriptions.find_one({"_id": result.inserted_id})
            prescription["id"] = str(prescription["_id"])
            del prescription["_id"]
            
            logger.info(f"Prescription created successfully for doctor: {prescription_data['doctor_id']}")
            return prescription
            
        except Exception as e:
            logger.error(f"Error creating prescription: {e}")
            raise e

    async def get_prescriptions_by_doctor(self, doctor_id: str, skip: int = 0, limit: int = 50) -> List[dict]:
        """Get prescriptions by doctor ID"""
        try:
            cursor = self.db.prescriptions.find({"doctor_id": doctor_id}).sort("created_at", -1).skip(skip).limit(limit)
            prescriptions = []
            async for prescription in cursor:
                prescription["id"] = str(prescription["_id"])
                del prescription["_id"]
                prescriptions.append(prescription)
            return prescriptions
        except Exception as e:
            logger.error(f"Error getting prescriptions by doctor: {e}")
            return []

    async def get_prescription_by_id(self, prescription_id: str) -> Optional[dict]:
        """Get prescription by ID"""
        try:
            from bson import ObjectId
            prescription = await self.db.prescriptions.find_one({"_id": ObjectId(prescription_id)})
            if prescription:
                prescription["id"] = str(prescription["_id"])
                del prescription["_id"]
            return prescription
        except Exception as e:
            logger.error(f"Error getting prescription by ID: {e}")
            return None

    async def update_prescription(self, prescription_id: str, update_data: dict) -> bool:
        """Update prescription"""
        try:
            from bson import ObjectId
            update_data["updated_at"] = datetime.utcnow()
            
            result = await self.db.prescriptions.update_one(
                {"_id": ObjectId(prescription_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating prescription: {e}")
            return False

# Drug Database Operations
class DrugDB:
    def __init__(self):
        self.db = None

    async def init_db(self):
        self.db = await MongoDB.get_database()
        # Initialize with default drug data
        await self.initialize_drug_database()

    async def initialize_drug_database(self):
        """Initialize drug database with comprehensive data"""
        try:
            # Check if drug database is already populated
            count = await self.db.drug_database.count_documents({})
            if count > 0:
                logger.info(f"Drug database already populated with {count} drugs")
                return

            # Import comprehensive drug database
            from drug_database import COMPREHENSIVE_DRUG_DATABASE
            
            drugs_to_insert = []
            for drug_name, drug_data in COMPREHENSIVE_DRUG_DATABASE.items():
                drug_doc = {
                    "name": drug_name,
                    "drug_class": drug_data.get("class", "Unknown"),
                    "interactions": drug_data.get("interactions", []),
                    "food_interactions": drug_data.get("foodInteractions", []),
                    "warnings": drug_data.get("warnings", ""),
                    "contraindications": drug_data.get("contraindications", []),
                    "side_effects": drug_data.get("sideEffects", []),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                drugs_to_insert.append(drug_doc)

            if drugs_to_insert:
                result = await self.db.drug_database.insert_many(drugs_to_insert)
                logger.info(f"Inserted {len(result.inserted_ids)} drugs into database")
            
        except Exception as e:
            logger.error(f"Error initializing drug database: {e}")

    async def get_drug_info(self, drug_name: str) -> Optional[dict]:
        """Get drug information by name"""
        try:
            drug = await self.db.drug_database.find_one({"name": {"$regex": f"^{drug_name}$", "$options": "i"}})
            if drug:
                drug["id"] = str(drug["_id"])
                del drug["_id"]
            return drug
        except Exception as e:
            logger.error(f"Error getting drug info: {e}")
            return None

    async def search_drugs(self, query: str, limit: int = 20) -> List[dict]:
        """Search drugs by name"""
        try:
            cursor = self.db.drug_database.find(
                {"name": {"$regex": query, "$options": "i"}}
            ).limit(limit)
            
            drugs = []
            async for drug in cursor:
                drug["id"] = str(drug["_id"])
                del drug["_id"]
                drugs.append(drug)
            return drugs
        except Exception as e:
            logger.error(f"Error searching drugs: {e}")
            return []

    async def check_interactions(self, drug_names: List[str]) -> List[dict]:
        """Check for drug interactions"""
        interactions = []
        try:
            # Get all drugs info
            drugs_info = {}
            for drug_name in drug_names:
                drug_info = await self.get_drug_info(drug_name)
                if drug_info:
                    drugs_info[drug_name.lower()] = drug_info

            # Check drug-drug interactions
            for i, drug1 in enumerate(drug_names):
                for j, drug2 in enumerate(drug_names[i+1:], i+1):
                    drug1_info = drugs_info.get(drug1.lower())
                    if drug1_info and drug2.lower() in [inter.lower() for inter in drug1_info["interactions"]]:
                        interactions.append({
                            "type": "drug-drug",
                            "severity": "high",
                            "drug1": drug1,
                            "drug2": drug2,
                            "description": f"Interaction between {drug1} and {drug2}",
                            "warning": drug1_info["warnings"]
                        })

            # Check contraindications and food interactions
            for drug_name in drug_names:
                drug_info = drugs_info.get(drug_name.lower())
                if drug_info:
                    if drug_info["food_interactions"]:
                        interactions.append({
                            "type": "drug-food",
                            "severity": "moderate",
                            "drug": drug_name,
                            "foods": drug_info["food_interactions"],
                            "description": f"Food interactions with {drug_name}",
                            "warning": drug_info["warnings"]
                        })
                    
                    if drug_info["contraindications"]:
                        interactions.append({
                            "type": "contraindication",
                            "severity": "critical",
                            "drug": drug_name,
                            "contraindications": drug_info["contraindications"],
                            "description": f"Contraindications for {drug_name}",
                            "warning": f"Critical: Review contraindications for {drug_name}"
                        })

            return interactions

        except Exception as e:
            logger.error(f"Error checking interactions: {e}")
            return []

# Initialize database instances
user_db = UserDB()
prescription_db = PrescriptionDB()
drug_db = DrugDB()

# Import EHR database
from ehr_database import ehr_db

# Import Patient Storage and Templates
from patient_storage import patient_storage_db, medication_template_db
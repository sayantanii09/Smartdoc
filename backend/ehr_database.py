"""
EHR Database Operations
Handles CRUD operations for EHR configurations and submissions
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict

from database import MongoDB
from models import EHRConfiguration, EHRSubmission, EHRConnectionTest

logger = logging.getLogger(__name__)

class EHRDatabase:
    """Database operations for EHR integration"""
    
    def __init__(self):
        self.db = None
        self.ehr_configs_collection = "ehr_configurations"
        self.ehr_submissions_collection = "ehr_submissions" 
        self.ehr_tests_collection = "ehr_connection_tests"
    
    async def init_db(self):
        """Initialize database connection"""
        self.db = MongoDB.database
        await self._create_indexes()
    
    async def _create_indexes(self):
        """Create database indexes for optimal performance"""
        try:
            # EHR configurations indexes
            await self.db[self.ehr_configs_collection].create_index("doctor_id")
            await self.db[self.ehr_configs_collection].create_index("provider")
            
            # EHR submissions indexes
            await self.db[self.ehr_submissions_collection].create_index("doctor_id")
            await self.db[self.ehr_submissions_collection].create_index("prescription_id")
            await self.db[self.ehr_submissions_collection].create_index("ehr_provider")
            await self.db[self.ehr_submissions_collection].create_index("submitted_at")
            await self.db[self.ehr_submissions_collection].create_index("status")
            
            # EHR connection tests indexes
            await self.db[self.ehr_tests_collection].create_index("doctor_id")
            await self.db[self.ehr_tests_collection].create_index("provider")
            await self.db[self.ehr_tests_collection].create_index("last_tested")
            
        except Exception as e:
            logger.error(f"Error creating EHR database indexes: {e}")
    
    # EHR Configuration CRUD Operations
    async def save_ehr_configuration(self, doctor_id: str, config: EHRConfiguration) -> Dict:
        """Save or update EHR configuration for a doctor"""
        try:
            config_data = config.model_dump()
            config_data.update({
                "id": str(uuid.uuid4()),
                "doctor_id": doctor_id,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "is_active": True
            })
            
            # Check if configuration already exists for this doctor and provider
            existing_config = await self.db[self.ehr_configs_collection].find_one({
                "doctor_id": doctor_id,
                "provider": config.provider.value
            })
            
            if existing_config:
                # Update existing configuration
                config_data["id"] = existing_config["id"]
                config_data["created_at"] = existing_config["created_at"]
                
                await self.db[self.ehr_configs_collection].replace_one(
                    {"id": existing_config["id"]},
                    config_data
                )
            else:
                # Create new configuration
                await self.db[self.ehr_configs_collection].insert_one(config_data)
            
            logger.info(f"EHR configuration saved for doctor {doctor_id}, provider {config.provider}")
            return config_data
            
        except Exception as e:
            logger.error(f"Error saving EHR configuration: {e}")
            raise ValueError(f"Failed to save EHR configuration: {str(e)}")
    
    async def get_ehr_configurations(self, doctor_id: str) -> List[Dict]:
        """Get all EHR configurations for a doctor"""
        try:
            cursor = self.db[self.ehr_configs_collection].find({
                "doctor_id": doctor_id,
                "is_active": True
            }).sort("created_at", -1)
            
            configs = []
            async for config in cursor:
                # Convert ObjectId to string for JSON serialization
                if "_id" in config:
                    config["_id"] = str(config["_id"])
                configs.append(config)
            
            return configs
            
        except Exception as e:
            logger.error(f"Error getting EHR configurations: {e}")
            return []
    
    async def get_ehr_configuration_by_provider(self, doctor_id: str, provider: str) -> Optional[Dict]:
        """Get EHR configuration by doctor and provider"""
        try:
            config = await self.db[self.ehr_configs_collection].find_one({
                "doctor_id": doctor_id,
                "provider": provider,
                "is_active": True
            })
            
            if config and "_id" in config:
                config["_id"] = str(config["_id"])
            
            return config
            
        except Exception as e:
            logger.error(f"Error getting EHR configuration by provider: {e}")
            return None
    
    async def delete_ehr_configuration(self, doctor_id: str, config_id: str) -> bool:
        """Delete EHR configuration"""
        try:
            result = await self.db[self.ehr_configs_collection].update_one(
                {"id": config_id, "doctor_id": doctor_id},
                {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
            )
            
            if result.modified_count > 0:
                logger.info(f"EHR configuration {config_id} deleted for doctor {doctor_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting EHR configuration: {e}")
            return False
    
    # EHR Submission CRUD Operations
    async def save_ehr_submission(self, doctor_id: str, submission: EHRSubmission) -> Dict:
        """Save EHR submission record"""
        try:
            submission_data = submission.model_dump()
            submission_data.update({
                "id": str(uuid.uuid4()),
                "doctor_id": doctor_id,
                "status": "pending",
                "retry_count": 0,
                "submitted_at": datetime.now(timezone.utc),
                "completed_at": None,
                "ehr_response": None,
                "error_message": None
            })
            
            await self.db[self.ehr_submissions_collection].insert_one(submission_data)
            
            logger.info(f"EHR submission saved for prescription {submission.prescription_id}")
            return submission_data
            
        except Exception as e:
            logger.error(f"Error saving EHR submission: {e}")
            raise ValueError(f"Failed to save EHR submission: {str(e)}")
    
    async def update_ehr_submission_status(
        self, 
        submission_id: str, 
        status: str,
        ehr_response: Optional[Dict] = None,
        error_message: Optional[str] = None
    ) -> bool:
        """Update EHR submission status"""
        try:
            update_data = {
                "status": status,
                "updated_at": datetime.now(timezone.utc)
            }
            
            if status in ["success", "failed"]:
                update_data["completed_at"] = datetime.now(timezone.utc)
            
            if ehr_response:
                update_data["ehr_response"] = ehr_response
            
            if error_message:
                update_data["error_message"] = error_message
            
            if status == "retry":
                # Increment retry count
                await self.db[self.ehr_submissions_collection].update_one(
                    {"id": submission_id},
                    {"$inc": {"retry_count": 1}}
                )
            
            result = await self.db[self.ehr_submissions_collection].update_one(
                {"id": submission_id},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating EHR submission status: {e}")
            return False
    
    async def get_ehr_submissions(
        self, 
        doctor_id: str, 
        skip: int = 0, 
        limit: int = 50,
        status: Optional[str] = None
    ) -> List[Dict]:
        """Get EHR submissions for a doctor"""
        try:
            filter_query = {"doctor_id": doctor_id}
            
            if status:
                filter_query["status"] = status
            
            cursor = self.db[self.ehr_submissions_collection].find(filter_query)\
                .sort("submitted_at", -1)\
                .skip(skip)\
                .limit(limit)
            
            submissions = []
            async for submission in cursor:
                submissions.append(submission)
            
            return submissions
            
        except Exception as e:
            logger.error(f"Error getting EHR submissions: {e}")
            return []
    
    async def get_ehr_submission_by_id(self, submission_id: str) -> Optional[Dict]:
        """Get EHR submission by ID"""
        try:
            submission = await self.db[self.ehr_submissions_collection].find_one({
                "id": submission_id
            })
            
            return submission
            
        except Exception as e:
            logger.error(f"Error getting EHR submission by ID: {e}")
            return None
    
    # EHR Connection Test Operations
    async def save_ehr_connection_test(self, doctor_id: str, test_result: EHRConnectionTest) -> Dict:
        """Save EHR connection test result"""
        try:
            test_data = test_result.model_dump()
            test_data.update({
                "id": str(uuid.uuid4()),
                "doctor_id": doctor_id,
                "created_at": datetime.now(timezone.utc)
            })
            
            # Remove old test results for this provider (keep only latest 10)
            old_tests = self.db[self.ehr_tests_collection].find({
                "doctor_id": doctor_id,
                "provider": test_result.provider.value
            }).sort("created_at", -1).skip(10)
            
            async for old_test in old_tests:
                await self.db[self.ehr_tests_collection].delete_one({"_id": old_test["_id"]})
            
            await self.db[self.ehr_tests_collection].insert_one(test_data)
            
            logger.info(f"EHR connection test saved for doctor {doctor_id}, provider {test_result.provider}")
            return test_data
            
        except Exception as e:
            logger.error(f"Error saving EHR connection test: {e}")
            raise ValueError(f"Failed to save connection test: {str(e)}")
    
    async def get_latest_connection_test(self, doctor_id: str, provider: str) -> Optional[Dict]:
        """Get latest connection test for a provider"""
        try:
            test = await self.db[self.ehr_tests_collection].find_one({
                "doctor_id": doctor_id,
                "provider": provider
            }, sort=[("created_at", -1)])
            
            return test
            
        except Exception as e:
            logger.error(f"Error getting latest connection test: {e}")
            return None
    
    async def get_connection_test_history(
        self, 
        doctor_id: str, 
        provider: str,
        limit: int = 10
    ) -> List[Dict]:
        """Get connection test history for a provider"""
        try:
            cursor = self.db[self.ehr_tests_collection].find({
                "doctor_id": doctor_id,
                "provider": provider
            }).sort("created_at", -1).limit(limit)
            
            tests = []
            async for test in cursor:
                tests.append(test)
            
            return tests
            
        except Exception as e:
            logger.error(f"Error getting connection test history: {e}")
            return []

# Global instance
ehr_db = EHRDatabase()
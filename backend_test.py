#!/usr/bin/env python3
"""
Backend Test Suite for SmartDoc Pro EHR Integration
Tests all EHR integration endpoints with comprehensive scenarios
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
from typing import Dict, Any

# Test configuration
BASE_URL = "https://shrutapex-dev.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class EHRBackendTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_doctor_id = None
        self.test_results = []
        self.saved_patient_code = None  # Store patient code for search tests
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    async def test_health_check(self):
        """Test 1: Health Check Endpoint"""
        try:
            async with self.session.get(f"{API_BASE}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "healthy":
                        self.log_test("Health Check", True, "Backend is healthy", data)
                        return True
                    else:
                        self.log_test("Health Check", False, "Unexpected health status", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Health Check", False, f"HTTP {response.status}", {"response": text})
                    return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    async def test_doctor_registration_and_login(self):
        """Test 2: Doctor Registration and Authentication"""
        # Generate unique test doctor credentials
        test_username = f"test_doctor_{uuid.uuid4().hex[:8]}"
        test_password = "TestPassword123!"
        
        # Registration data
        registration_data = {
            "name": "Dr. Sarah Johnson",
            "degree": "MD",
            "registration_number": f"REG{uuid.uuid4().hex[:8].upper()}",
            "organization": "SmartDoc Test Hospital",
            "email": f"{test_username}@testdomain.com",
            "phone": "+1-555-0123",
            "specialization": "Internal Medicine",
            "username": test_username,
            "password": test_password
        }
        
        try:
            # Test registration
            async with self.session.post(
                f"{API_BASE}/auth/register",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    reg_data = await response.json()
                    if reg_data.get("success"):
                        self.log_test("Doctor Registration", True, "Registration successful", reg_data)
                    else:
                        self.log_test("Doctor Registration", False, "Registration failed", reg_data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Doctor Registration", False, f"HTTP {response.status}", {"response": text})
                    return False
            
            # Test login
            login_data = {
                "username": test_username,
                "password": test_password
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    login_response = await response.json()
                    if login_response.get("access_token"):
                        self.auth_token = login_response["access_token"]
                        self.test_doctor_id = login_response["user"]["id"]
                        self.log_test("Doctor Login", True, "Login successful", {
                            "token_type": login_response.get("token_type"),
                            "user_id": self.test_doctor_id
                        })
                        return True
                    else:
                        self.log_test("Doctor Login", False, "No access token received", login_response)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Doctor Login", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Doctor Authentication", False, f"Error: {str(e)}")
            return False
    
    async def test_ehr_providers(self):
        """Test 3: Get EHR Providers"""
        if not self.auth_token:
            self.log_test("EHR Providers", False, "No authentication token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(f"{API_BASE}/ehr/providers", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data", {}).get("providers"):
                        providers = data["data"]["providers"]
                        expected_providers = ["Epic", "Cerner", "Allscripts", "AthenaHealth", "eClinicalWorks"]
                        
                        provider_values = [p.get("value") for p in providers]
                        found_providers = [p for p in expected_providers if p in provider_values]
                        
                        self.log_test("EHR Providers", True, f"Retrieved {len(providers)} providers", {
                            "total_providers": len(providers),
                            "expected_found": len(found_providers),
                            "providers": provider_values
                        })
                        return True
                    else:
                        self.log_test("EHR Providers", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("EHR Providers", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("EHR Providers", False, f"Error: {str(e)}")
            return False
    
    async def test_ehr_configuration(self):
        """Test 4: EHR Configuration Management"""
        if not self.auth_token:
            self.log_test("EHR Configuration", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test Epic configuration with OAuth
            epic_config = {
                "provider": "Epic",
                "base_url": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/",
                "client_id": "test_client_id_epic",
                "client_secret": "test_client_secret_epic",
                "auth_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
                "token_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
                "scope": "patient/*.read patient/*.write",
                "use_oauth": True,
                "organization_id": "TEST_ORG_EPIC",
                "facility_id": "TEST_FACILITY_EPIC",
                "timeout": 30,
                "verify_ssl": True
            }
            
            # Save Epic configuration
            async with self.session.post(
                f"{API_BASE}/ehr/configure",
                json=epic_config,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        self.log_test("EHR Configuration (Epic OAuth)", True, "Epic configuration saved", data)
                    else:
                        self.log_test("EHR Configuration (Epic OAuth)", False, "Failed to save Epic config", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("EHR Configuration (Epic OAuth)", False, f"HTTP {response.status}", {"response": text})
                    return False
            
            # Test Cerner configuration with API Key
            cerner_config = {
                "provider": "Cerner",
                "base_url": "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d/",
                "use_oauth": False,
                "api_key": "test_api_key_cerner_12345",
                "organization_id": "TEST_ORG_CERNER",
                "facility_id": "TEST_FACILITY_CERNER",
                "timeout": 30,
                "verify_ssl": True
            }
            
            # Save Cerner configuration
            async with self.session.post(
                f"{API_BASE}/ehr/configure",
                json=cerner_config,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        self.log_test("EHR Configuration (Cerner API Key)", True, "Cerner configuration saved", data)
                        return True
                    else:
                        self.log_test("EHR Configuration (Cerner API Key)", False, "Failed to save Cerner config", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("EHR Configuration (Cerner API Key)", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("EHR Configuration", False, f"Error: {str(e)}")
            return False
    
    async def test_ehr_connection_test(self):
        """Test 5: EHR Connection Testing"""
        if not self.auth_token:
            self.log_test("EHR Connection Test", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test connection with Epic configuration
            test_config = {
                "provider": "Epic",
                "base_url": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/",
                "client_id": "test_client_id",
                "client_secret": "test_client_secret",
                "auth_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
                "token_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
                "scope": "patient/*.read patient/*.write",
                "use_oauth": True,
                "timeout": 30,
                "verify_ssl": True
            }
            
            async with self.session.post(
                f"{API_BASE}/ehr/test-connection",
                json=test_config,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    # Connection test may fail due to invalid credentials, but endpoint should work
                    if "data" in data and "status" in data["data"]:
                        status = data["data"]["status"]
                        self.log_test("EHR Connection Test", True, f"Connection test completed with status: {status}", data)
                        return True
                    else:
                        self.log_test("EHR Connection Test", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("EHR Connection Test", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("EHR Connection Test", False, f"Error: {str(e)}")
            return False
    
    async def test_get_ehr_configurations(self):
        """Test 6: Get EHR Configurations"""
        if not self.auth_token:
            self.log_test("Get EHR Configurations", False, "No authentication token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(f"{API_BASE}/ehr/configurations", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and "configurations" in data.get("data", {}):
                        configurations = data["data"]["configurations"]
                        self.log_test("Get EHR Configurations", True, f"Retrieved {len(configurations)} configurations", {
                            "count": len(configurations),
                            "providers": [config.get("provider") for config in configurations]
                        })
                        return True
                    else:
                        self.log_test("Get EHR Configurations", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Get EHR Configurations", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Get EHR Configurations", False, f"Error: {str(e)}")
            return False
    
    async def test_authentication_required_endpoints(self):
        """Test 7: Authentication Required for Protected Endpoints"""
        get_endpoints = [
            "/ehr/providers",
            "/ehr/configurations"
        ]
        
        post_endpoints = [
            "/ehr/configure",
            "/ehr/test-connection"
        ]
        
        all_passed = True
        
        # Test GET endpoints without authentication
        for endpoint in get_endpoints:
            try:
                async with self.session.get(f"{API_BASE}{endpoint}") as response:
                    if response.status in [401, 403]:  # Both are valid auth errors
                        self.log_test(f"Auth Required - GET {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                    else:
                        self.log_test(f"Auth Required - GET {endpoint}", False, f"Expected 401/403, got {response.status}")
                        all_passed = False
                        
            except Exception as e:
                self.log_test(f"Auth Required - GET {endpoint}", False, f"Error: {str(e)}")
                all_passed = False
        
        # Test POST endpoints without authentication
        for endpoint in post_endpoints:
            try:
                async with self.session.post(f"{API_BASE}{endpoint}", json={}) as response:
                    if response.status in [401, 403]:  # Both are valid auth errors
                        self.log_test(f"Auth Required - POST {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                    else:
                        self.log_test(f"Auth Required - POST {endpoint}", False, f"Expected 401/403, got {response.status}")
                        all_passed = False
                        
            except Exception as e:
                self.log_test(f"Auth Required - POST {endpoint}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    async def test_patient_save(self):
        """Test 8: Save Patient Information"""
        if not self.auth_token:
            self.log_test("Patient Save", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Comprehensive patient data
            patient_data = {
                "patient_info": {
                    "name": "John Michael Smith",
                    "age": 45,
                    "gender": "Male",
                    "contact_number": "+1-555-0199",
                    "email": "john.smith@email.com",
                    "address": "123 Main Street, Springfield, IL 62701",
                    "emergency_contact": "Jane Smith - Wife - +1-555-0200",
                    "insurance_info": "Blue Cross Blue Shield - Policy: BC123456789"
                },
                "medical_history": {
                    "allergies": ["Penicillin", "Shellfish"],
                    "chronic_conditions": ["Type 2 Diabetes", "Hypertension"],
                    "current_medications": [
                        {
                            "name": "Metformin",
                            "dosage": "500mg",
                            "frequency": "twice daily",
                            "route": "oral"
                        },
                        {
                            "name": "Lisinopril",
                            "dosage": "10mg",
                            "frequency": "once daily",
                            "route": "oral"
                        }
                    ],
                    "past_surgeries": ["Appendectomy (2015)"],
                    "family_history": ["Diabetes (Father)", "Heart Disease (Mother)"],
                    "social_history": "Non-smoker, occasional alcohol use",
                    "vaccination_status": "COVID-19 vaccinated, Flu shot current"
                },
                "diagnosis": "Type 2 Diabetes Mellitus with good glycemic control. Essential Hypertension, well-controlled.",
                "prognosis": "Good prognosis with continued medication compliance and lifestyle modifications. Regular monitoring recommended.",
                "notes": "Patient is compliant with medications. Recommend quarterly HbA1c monitoring and annual eye exams."
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/save",
                json=patient_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data", {}).get("patient_code"):
                        self.saved_patient_code = data["data"]["patient_code"]
                        patient_id = data["data"]["id"]
                        visit_date = data["data"]["visit_date"]
                        
                        # Validate patient code format (6-8 characters)
                        code_length = len(self.saved_patient_code)
                        if 6 <= code_length <= 8:
                            self.log_test("Patient Save", True, f"Patient saved successfully with code: {self.saved_patient_code}", {
                                "patient_code": self.saved_patient_code,
                                "patient_id": patient_id,
                                "visit_date": visit_date,
                                "code_length": code_length
                            })
                            return True
                        else:
                            self.log_test("Patient Save", False, f"Invalid patient code length: {code_length} (expected 6-8)", data)
                            return False
                    else:
                        self.log_test("Patient Save", False, "No patient code in response", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Patient Save", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Patient Save", False, f"Error: {str(e)}")
            return False
    
    async def test_patient_search(self):
        """Test 9: Search Patient by Code"""
        if not self.auth_token:
            self.log_test("Patient Search", False, "No authentication token available")
            return False
        
        if not self.saved_patient_code:
            self.log_test("Patient Search", False, "No saved patient code available for search")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            search_data = {
                "patient_code": self.saved_patient_code
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/search",
                json=search_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data", {}).get("patient"):
                        patient = data["data"]["patient"]
                        
                        # Verify patient data integrity
                        expected_fields = ["patient_code", "patient_info", "medical_history", "diagnosis", "prognosis"]
                        missing_fields = [field for field in expected_fields if field not in patient]
                        
                        if not missing_fields:
                            # Verify patient code matches
                            if patient["patient_code"] == self.saved_patient_code:
                                # Verify patient name
                                patient_name = patient.get("patient_info", {}).get("name")
                                if patient_name == "John Michael Smith":
                                    self.log_test("Patient Search", True, f"Patient found successfully with code: {self.saved_patient_code}", {
                                        "patient_code": patient["patient_code"],
                                        "patient_name": patient_name,
                                        "doctor_id": patient.get("doctor_id"),
                                        "visit_date": patient.get("visit_date")
                                    })
                                    return True
                                else:
                                    self.log_test("Patient Search", False, f"Patient name mismatch: expected 'John Michael Smith', got '{patient_name}'")
                                    return False
                            else:
                                self.log_test("Patient Search", False, f"Patient code mismatch: expected '{self.saved_patient_code}', got '{patient['patient_code']}'")
                                return False
                        else:
                            self.log_test("Patient Search", False, f"Missing required fields: {missing_fields}", patient)
                            return False
                    else:
                        self.log_test("Patient Search", False, "No patient data in response", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Patient Search", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Patient Search", False, f"Error: {str(e)}")
            return False
    
    async def test_patient_search_invalid_code(self):
        """Test 10: Search Patient with Invalid Code"""
        if not self.auth_token:
            self.log_test("Patient Search Invalid Code", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test with non-existent patient code
            search_data = {
                "patient_code": "INVALID123"
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/search",
                json=search_data,
                headers=headers
            ) as response:
                
                if response.status == 404:
                    data = await response.json()
                    if not data.get("success"):
                        self.log_test("Patient Search Invalid Code", True, "Correctly returned 404 for invalid patient code", data)
                        return True
                    else:
                        self.log_test("Patient Search Invalid Code", False, "Expected success=false for invalid code", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Patient Search Invalid Code", False, f"Expected HTTP 404, got {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Patient Search Invalid Code", False, f"Error: {str(e)}")
            return False
    
    async def test_get_my_patients(self):
        """Test 11: Get Doctor's Saved Patients"""
        if not self.auth_token:
            self.log_test("Get My Patients", False, "No authentication token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(f"{API_BASE}/patients/my-patients", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and "patients" in data.get("data", {}):
                        patients = data["data"]["patients"]
                        patient_count = data["data"]["count"]
                        
                        # Should have at least 1 patient (the one we saved)
                        if patient_count >= 1:
                            # Find our saved patient
                            our_patient = None
                            for patient in patients:
                                if patient.get("patient_code") == self.saved_patient_code:
                                    our_patient = patient
                                    break
                            
                            if our_patient:
                                self.log_test("Get My Patients", True, f"Retrieved {patient_count} patients including our saved patient", {
                                    "total_patients": patient_count,
                                    "found_our_patient": True,
                                    "our_patient_code": self.saved_patient_code,
                                    "our_patient_name": our_patient.get("patient_info", {}).get("name")
                                })
                                return True
                            else:
                                self.log_test("Get My Patients", False, f"Our saved patient (code: {self.saved_patient_code}) not found in results", {
                                    "total_patients": patient_count,
                                    "patient_codes": [p.get("patient_code") for p in patients]
                                })
                                return False
                        else:
                            self.log_test("Get My Patients", False, f"Expected at least 1 patient, got {patient_count}")
                            return False
                    else:
                        self.log_test("Get My Patients", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Get My Patients", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Get My Patients", False, f"Error: {str(e)}")
            return False
    
    async def test_patient_endpoints_authentication(self):
        """Test 12: Patient Endpoints Require Authentication"""
        patient_endpoints = [
            ("GET", "/patients/my-patients"),
            ("POST", "/patients/save"),
            ("POST", "/patients/search")
        ]
        
        all_passed = True
        
        for method, endpoint in patient_endpoints:
            try:
                if method == "GET":
                    async with self.session.get(f"{API_BASE}{endpoint}") as response:
                        if response.status in [401, 403]:
                            self.log_test(f"Auth Required - {method} {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                        else:
                            self.log_test(f"Auth Required - {method} {endpoint}", False, f"Expected 401/403, got {response.status}")
                            all_passed = False
                else:  # POST
                    async with self.session.post(f"{API_BASE}{endpoint}", json={}) as response:
                        if response.status in [401, 403]:
                            self.log_test(f"Auth Required - {method} {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                        else:
                            self.log_test(f"Auth Required - {method} {endpoint}", False, f"Expected 401/403, got {response.status}")
                            all_passed = False
                            
            except Exception as e:
                self.log_test(f"Auth Required - {method} {endpoint}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    async def run_all_tests(self):
        """Run all EHR integration tests"""
        print("🚀 Starting SmartDoc Pro EHR Integration Backend Tests")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Doctor Authentication", self.test_doctor_registration_and_login),
            ("EHR Providers", self.test_ehr_providers),
            ("EHR Configuration", self.test_ehr_configuration),
            ("EHR Connection Test", self.test_ehr_connection_test),
            ("Get EHR Configurations", self.test_get_ehr_configurations),
            ("Authentication Required", self.test_authentication_required_endpoints)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 Running: {test_name}")
            try:
                result = await test_func()
                if result:
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
        
        # Summary
        print("\n" + "=" * 60)
        print(f"🏁 Test Summary: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All EHR integration tests PASSED!")
        else:
            print(f"❌ {total - passed} tests FAILED")
            
        # Detailed results
        print("\n📊 Detailed Results:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        return passed, total, self.test_results

async def main():
    """Main test execution"""
    async with EHRBackendTester() as tester:
        passed, total, results = await tester.run_all_tests()
        
        # Save results to file
        with open("/app/ehr_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "passed": passed,
                    "total": total,
                    "success_rate": f"{(passed/total)*100:.1f}%",
                    "timestamp": datetime.now().isoformat()
                },
                "results": results
            }, f, indent=2)
        
        print(f"\n💾 Results saved to /app/ehr_test_results.json")
        
        return passed == total

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
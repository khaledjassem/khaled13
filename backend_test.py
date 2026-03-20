#!/usr/bin/env python3

import asyncio
import aiohttp
import json
from datetime import datetime

# Backend URL from frontend environment
BASE_URL = "https://balance-recharge-app.preview.emergentagent.com/api"

class PortfolioAPITester:
    def __init__(self):
        self.session = None
        self.results = {}
        
    async def setup(self):
        """Setup the test session"""
        self.session = aiohttp.ClientSession()
        
    async def teardown(self):
        """Cleanup the test session"""
        if self.session:
            await self.session.close()
    
    async def test_endpoint(self, method: str, endpoint: str, name: str, expected_status: int = 200, data=None, headers=None):
        """Test a single endpoint"""
        url = f"{BASE_URL}{endpoint}"
        print(f"\n🧪 Testing {name}")
        print(f"   {method} {url}")
        
        try:
            kwargs = {}
            if data:
                kwargs['json'] = data
            if headers:
                kwargs['headers'] = headers
                
            async with self.session.request(method, url, **kwargs) as response:
                status = response.status
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                success = status == expected_status
                
                self.results[name] = {
                    "success": success,
                    "status_code": status,
                    "expected_status": expected_status,
                    "endpoint": endpoint,
                    "method": method,
                    "response": response_data if success else f"Error: {status} - {response_data}"
                }
                
                if success:
                    print(f"   ✅ SUCCESS: {status}")
                    if isinstance(response_data, dict):
                        if "message" in response_data:
                            print(f"      Message: {response_data['message']}")
                        elif isinstance(response_data, list):
                            print(f"      Items returned: {len(response_data)}")
                        else:
                            print(f"      Data keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                else:
                    print(f"   ❌ FAILED: {status} (expected {expected_status})")
                    print(f"      Response: {response_data}")
                
                return success, response_data
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            self.results[name] = {
                "success": False,
                "status_code": 0,
                "expected_status": expected_status,
                "endpoint": endpoint,
                "method": method,
                "response": f"Connection Error: {str(e)}"
            }
            return False, str(e)
    
    async def run_tests(self):
        """Run all portfolio API tests"""
        print("🚀 Starting Khaled Jasem Portfolio API Tests")
        print(f"🌐 Base URL: {BASE_URL}")
        
        await self.setup()
        
        try:
            # 1. Health check
            await self.test_endpoint("GET", "/", "Health Check")
            
            # 2. Profile endpoint
            await self.test_endpoint("GET", "/profile", "Get Profile")
            
            # 3. Experience endpoints
            await self.test_endpoint("GET", "/experiences", "Get Experiences")
            
            # 4. Education endpoints
            await self.test_endpoint("GET", "/education", "Get Education")
            
            # 5. Skills endpoints
            await self.test_endpoint("GET", "/skills", "Get Skills")
            
            # 6. Research endpoints
            await self.test_endpoint("GET", "/research", "Get Research")
            
            # 7. Books endpoints
            await self.test_endpoint("GET", "/books", "Get Books")
            
            # 8. Projects endpoints
            await self.test_endpoint("GET", "/projects", "Get Projects")
            
            # 9. Awards endpoints
            await self.test_endpoint("GET", "/awards", "Get Awards")
            
            # 10. Certificates endpoints
            await self.test_endpoint("GET", "/certificates", "Get Certificates")
            
            # 11. Social Links endpoints
            await self.test_endpoint("GET", "/social-links", "Get Social Links")
            
            # 12. Full Portfolio Data
            await self.test_endpoint("GET", "/portfolio", "Get Full Portfolio Data")
            
            # 13. Health endpoint
            await self.test_endpoint("GET", "/health", "Health Check Endpoint")
            
            # Test Auth endpoints (should fail without authentication)
            await self.test_endpoint("GET", "/auth/me", "Get Current User (should fail)", expected_status=401)
            
        finally:
            await self.teardown()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for result in self.results.values() if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for name, result in self.results.items():
                if not result["success"]:
                    print(f"   ❌ {name}")
                    print(f"      {result['method']} {result['endpoint']}")
                    print(f"      Expected: {result['expected_status']}, Got: {result['status_code']}")
                    print(f"      Response: {result['response']}")
                    print()
        
        print("\n✅ PASSED TESTS:")
        for name, result in self.results.items():
            if result["success"]:
                print(f"   ✅ {name}")
        
        return passed_tests, failed_tests

async def main():
    """Main test function"""
    tester = PortfolioAPITester()
    await tester.run_tests()
    passed, failed = tester.print_summary()
    
    # Return exit code based on results
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
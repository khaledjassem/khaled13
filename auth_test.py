#!/usr/bin/env python3

import asyncio
import aiohttp
import json

BASE_URL = "https://balance-recharge-app.preview.emergentagent.com/api"

async def test_auth_endpoints():
    """Test authenticated endpoints to verify they require auth"""
    print("🔐 Testing Authentication-Protected Endpoints")
    
    async with aiohttp.ClientSession() as session:
        # Test POST endpoints without auth - they should all return 401
        auth_endpoints = [
            ("POST", "/experiences", "Create Experience"),
            ("PUT", "/experiences/test-id", "Update Experience"),  
            ("DELETE", "/experiences/test-id", "Delete Experience"),
            ("POST", "/education", "Create Education"),
            ("POST", "/skills", "Create Skill"),
            ("POST", "/research", "Create Research"),
            ("POST", "/books", "Create Book"),
            ("POST", "/projects", "Create Project"),
            ("POST", "/awards", "Create Award"),
            ("POST", "/certificates", "Create Certificate"),
            ("POST", "/social-links", "Create Social Link"),
            ("PUT", "/profile", "Update Profile")
        ]
        
        for method, endpoint, name in auth_endpoints:
            url = f"{BASE_URL}{endpoint}"
            print(f"\n🧪 Testing {name}")
            print(f"   {method} {url}")
            
            try:
                data = {"title": "Test"} if method == "POST" else None
                
                async with session.request(method, url, json=data) as response:
                    status = response.status
                    
                    if status == 401:
                        print(f"   ✅ CORRECT: {status} (Auth required as expected)")
                    elif status == 422:
                        print(f"   ⚠️  VALIDATION: {status} (Validation error - auth may be bypassed)")
                    else:
                        print(f"   ❌ UNEXPECTED: {status} (Expected 401)")
                        
            except Exception as e:
                print(f"   ❌ ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_auth_endpoints())
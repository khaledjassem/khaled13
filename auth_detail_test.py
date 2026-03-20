#!/usr/bin/env python3

import asyncio
import aiohttp
import json

BASE_URL = "https://balance-recharge-app.preview.emergentagent.com/api"

async def test_auth_detail():
    """Get detailed error messages for auth endpoints"""
    print("🔍 Detailed Auth Testing")
    
    async with aiohttp.ClientSession() as session:
        # Test POST with minimal valid data to see if auth kicks in before validation
        test_data = {
            "company": "Test Corp",
            "position": "Developer", 
            "start_date": "2024-01-01"
        }
        
        print("\n🧪 Testing POST /experiences with valid data (should be 401 not 422)")
        url = f"{BASE_URL}/experiences"
        
        try:
            async with session.post(url, json=test_data) as response:
                status = response.status
                response_data = await response.json()
                print(f"Status: {status}")
                print(f"Response: {json.dumps(response_data, indent=2)}")
                
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_auth_detail())
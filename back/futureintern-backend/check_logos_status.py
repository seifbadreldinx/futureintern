"""
Check if logos were uploaded successfully
"""
import requests

API_URL = "https://futureintern-production.up.railway.app/api/admin/list-companies-for-upload"

print("=== Checking Company Logos ===\n")

try:
    response = requests.get(API_URL)
    if response.status_code == 200:
        data = response.json()
        
        companies_with_logos = [c for c in data['companies'] if c['has_logo']]
        companies_without_logos = [c for c in data['companies'] if not c['has_logo']]
        
        print(f"Total companies: {data['total']}")
        print(f"With logos: {len(companies_with_logos)}")
        print(f"Without logos: {len(companies_without_logos)}\n")
        
        if companies_with_logos:
            print("Companies WITH logos:")
            for c in companies_with_logos:
                print(f"  ✓ {c['name']} (ID: {c['id']})")
            print()
        
        if companies_without_logos:
            print("Companies WITHOUT logos:")
            for c in companies_without_logos:
                print(f"  ✗ {c['name']} (ID: {c['id']})")
    else:
        print(f"Error: HTTP {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"Error: {e}")

"""
Verify which companies have logos uploaded
"""
import requests

API_URL = "https://futureintern-production.up.railway.app/api/admin/list-companies-for-upload"

print("=" * 60)
print("CHECKING LOGO STATUS IN PRODUCTION")
print("=" * 60)

try:
    response = requests.get(API_URL, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        companies = data.get('companies', [])
        
        print(f"\nTotal companies: {data.get('total', 0)}\n")
        
        with_logos = []
        without_logos = []
        
        for company in companies:
            name = company['name']
            has_logo = company.get('has_logo', False)
            logo_path = company.get('profile_image', None)
            
            if has_logo:
                with_logos.append((name, logo_path))
                print(f"✓ {name}: {logo_path}")
            else:
                without_logos.append(name)
                print(f"✗ {name}: NO LOGO")
        
        print("\n" + "=" * 60)
        print(f"Companies WITH logos: {len(with_logos)}")
        print(f"Companies WITHOUT logos: {len(without_logos)}")
        print("=" * 60)
        
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"Error: {str(e)}")

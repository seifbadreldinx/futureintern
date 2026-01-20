"""
Upload all generated logos to production
"""
import requests
import os
import glob

API_URL = "https://futureintern-production.up.railway.app/api/admin/bulk-upload-logos-ADMIN"

# Company mappings
company_mapping = {
    "logo_intcore.png": "Intcore",
    "logo_eand.png": "e&",
    "logo_robotesta.png": "Robotesta",
    "logo_pwc.png": "PwC",
    "logo_vodafone.png": "Vodafone",
    "logo_paymob.png": "Paymob",
    "logo_milkup.png": "Milkup",
    "logo_unicharm.png": "Unicharm",
    "logo_uniparticle.png": "Uniparticle",
    "logo_tips_hindawi.png": "Tips Hindawi",
    "logo_geidea.png": "Geidea",
    "logo_fawry.png": "Fawry",
    "logo_xefort_solutions.png": "XEFORT SOLUTIONS",
    "logo_cultiv_bureau.png": "Cultiv Bureau",
    "logo_skillinfytech.png": "SkillInfyTech",
    "logo_codtech_it_solutions.png": "CODTECH IT SOLUTIONS",
    "logo_weintern.png": "WeIntern",
    "logo_breadfast.png": "Breadfast",
}

print("=== Bulk Logo Upload ===\n")

# Prepare files and data
files_to_upload = []
form_data = {}
index = 1

script_dir = os.path.dirname(__file__)

for filename, company_name in company_mapping.items():
    filepath = os.path.join(script_dir, filename)
    if os.path.exists(filepath):
        print(f"✓ Found: {filename} -> {company_name}")
        files_to_upload.append((f'logo_{index}', (filename, open(filepath, 'rb'), 'image/png')))
        form_data[f'company_name_{index}'] = company_name
        index += 1
    else:
        print(f"✗ Missing: {filename}")

if not files_to_upload:
    print("\nNo logos found! Run: python generate_logos.py first")
    exit(1)

print(f"\nUploading {len(files_to_upload)} logos to production...\n")

try:
    response = requests.post(API_URL, files=files_to_upload, data=form_data)
    
    # Close all file handles
    for _, (_, file_obj, _) in files_to_upload:
        file_obj.close()
    
    if response.status_code == 200:
        result = response.json()
        print("=== Upload Results ===")
        print(f"Total: {result['total']}")
        print(f"Successful: {len(result['success'])}")
        print(f"Errors: {len(result['errors'])}\n")
        
        if result['success']:
            print("Successfully uploaded:")
            for item in result['success']:
                print(f"  ✓ {item['company_name']}")
            print()
        
        if result['errors']:
            print("Errors:")
            for item in result['errors']:
                print(f"  ✗ {item.get('company', 'Unknown')}: {item['error']}")
            print()
        
        print("✅ Done! Check: https://futureintern-two.vercel.app/companies")
    else:
        print(f"❌ Upload failed: HTTP {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Upload failed: {e}")
    # Close file handles on error
    for _, (_, file_obj, _) in files_to_upload:
        try:
            file_obj.close()
        except:
            pass

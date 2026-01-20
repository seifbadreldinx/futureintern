"""
Upload all real company logos to Railway production
"""
import requests
import os

API_URL = "https://futureintern-production.up.railway.app/api/admin/bulk-upload-logos-ADMIN"

# Map logo files to company names
logo_mapping = {
    "weinternx_logo.jpg": "WeIntern",
    "uniparticle_logo.jpg": "Uniparticle", 
    "Milkup-logo.jpg": "Milkup",
    "Intcore-logo.jpg": "Intcore",
    "eandgroup_logo.jpg": "e&",
    "robotesta_logo.jpg": "Robotesta",
    "fawrypayments_logo.jpg": "Fawry",
    "vodafone_logo.jpg": "Vodafone",
    "unicharm.jpg": "Unicharm",
    "Tips Hindawi.png": "Tips Hindawi",
    "skillnfytech.jpg": "SkillInfyTech",
    "XEFORT SOLUTIONS.jpg": "XEFORT SOLUTIONS",
    "geidea_logo.jpg": "Geidea",
    "pwc_middle_east_logo.jpg": "PwC",
    "paymobcompany_logo.jpg": "Paymob",
    "cultiv_bureau_logo.jpg": "Cultiv Bureau",
    "Breadfast.jpg": "Breadfast",
    "codetech.jpg": "CODTECH IT SOLUTIONS",
}

print("=" * 60)
print("UPLOADING REAL COMPANY LOGOS TO RAILWAY")
print("=" * 60)

logos_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'logos')
uploaded_count = 0
failed_count = 0

for filename, company_name in logo_mapping.items():
    filepath = os.path.join(logos_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"✗ File not found: {filename}")
        failed_count += 1
        continue
    
    try:
        with open(filepath, 'rb') as f:
            files = {'logo': (filename, f, 'image/jpeg' if filename.endswith('.jpg') else 'image/png')}
            data = {'company_name': company_name}
            
            response = requests.post(API_URL, files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                print(f"✓ Uploaded: {company_name} ({filename})")
                uploaded_count += 1
            else:
                print(f"✗ Failed: {company_name} - {response.status_code}")
                print(f"  Response: {response.text[:100]}")
                failed_count += 1
                
    except Exception as e:
        print(f"✗ Error uploading {company_name}: {str(e)}")
        failed_count += 1

print("\n" + "=" * 60)
print(f"✅ Successfully uploaded: {uploaded_count}")
print(f"❌ Failed: {failed_count}")
print("=" * 60)

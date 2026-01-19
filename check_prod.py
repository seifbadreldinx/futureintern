
import requests

url = "https://futureintern-production.up.railway.app/api/internships/"
headers = {"Origin": "https://futureintern.vercel.app"}

print(f"Testing {url}...")
try:
    r = requests.get(url, headers=headers, timeout=10)
    print(f"Status: {r.status_code}")
    print("Headers:")
    for k, v in r.headers.items():
        if 'Access-Control' in k:
            print(f"  {k}: {v}")
    
    if r.status_code == 200:
        print("Body preview:", r.text[:100])
    else:
        print("Error Body:", r.text)

except Exception as e:
    print(f"FAILED: {e}")

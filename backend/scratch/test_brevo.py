import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("BREVO_API_KEY")

if not api_key:
    print("Error: BREVO_API_KEY not found in .env")
    exit(1)

url = "https://api.brevo.com/v3/account"

headers = {
    "accept": "application/json",
    "api-key": api_key
}

try:
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print("SUCCESS: Brevo API Key is valid!")
        print(f"Company: {data.get('companyName')}")
        print(f"Plan: {data.get('plan')}")
    else:
        print(f"FAILED: Status {response.status_code}")
        print(f"Body: {response.text}")
except Exception as e:
    print(f"FAILED: An error occurred: {e}")

import requests
import json
import time

def test_streaming():
    url = "http://127.0.0.1:8001/api/v2/jobs/discovery?query=Software+Engineer&limit=5"
    payload = {"locations": ["Hyderabad"]}
    
    print(f"Connecting to {url}...")
    try:
        with requests.post(url, json=payload, stream=True) as r:
            r.raise_for_status()
            print("Connected. Streaming results:")
            for line in r.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    print(f"RECEIVE: {decoded_line[:100]}...")
                    # Basic JSON validation
                    try:
                        obj = json.loads(decoded_line)
                        print(f"VALID JSON: {obj.get('job_title')} at {obj.get('company_name')}")
                    except Exception as e:
                        print(f"INVALID JSON: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_streaming()

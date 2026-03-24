import requests
import json

URL = "http://localhost:8001/api/v1/imports/preview"
payload = {
    "urls": "https://example.com",
    "fileName": "test_import"
}

try:
    # Note: We expect an error if the server isn't running, but we can check the router logic via import
    print("Verifying router registration...")
    from app.api.router import api_router
    # Check if '/imports' is in the registered routes
    routes = [r.path for r in api_router.routes]
    print(f"Registered routes: {routes}")
    if "/imports" in routes:
        print("SUCCESS: '/imports' router is registered.")
    else:
        print("FAILURE: '/imports' router is NOT registered.")
except Exception as e:
    print(f"Verification failed: {e}")

import requests
import time
import os

# Use environment variable for base URL to support flexibility in port or domain
BASE_URL = os.environ.get("BACKEND_URL", "http://localhost/api")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost")


def wait_for_service(url, name):
    print(f"Waiting for {name} to become ready at {url}...")
    for i in range(10):
        try:
            r = requests.get(url)
            if r.status_code == 200:
                print(f"{name} is up and running.")
                return
        except Exception as e:
            print(f"Attempt {i+1}/10 failed: {e}")
        time.sleep(5)
    print(f"{name} did not start in time.")
    exit(1)


def test_frontend_root():
    print("🌐 Testing frontend root (Nginx)...")
    r = requests.get(FRONTEND_URL)
    assert r.status_code == 200, f"Frontend not serving: {r.status_code}"
    assert "<html" in r.text.lower(), "Unexpected content served"
    print("Frontend (Nginx) static content is being served.")


def test_health_check():
    print("Testing /health endpoint...")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert data.get("status") == "ok", "Expected status 'ok'"
    print("Health check passed.")


def test_signup_and_login():
    print("🔍 Testing /signup and /login endpoints...")
    username = f"testuser_{int(time.time())}"
    password = "testpassword"

    r = requests.post(f"{BASE_URL}/signup", json={"username": username, "password": password})
    assert r.status_code == 200, f"Signup failed: {r.status_code}, {r.text}"
    token = r.json().get("token")
    assert token, "Signup did not return a token"
    print("Signup passed.")

    r = requests.post(f"{BASE_URL}/login", json={"username": username, "password": password})
    assert r.status_code == 200, f"Login failed: {r.status_code}, {r.text}"
    token = r.json().get("token")
    assert token, "Login did not return a token"
    print("Login passed.")


def test_get_boards():
    print("🔍 Testing authenticated /boards GET...")
    username = f"testuser_{int(time.time())}"
    password = "testpassword"

    r = requests.post(f"{BASE_URL}/signup", json={"username": username, "password": password})
    assert r.status_code in (200, 409), f"Signup failed: {r.status_code}, {r.text}"

    if r.status_code == 200:
        token = r.json().get("token")
    else:
        r = requests.post(f"{BASE_URL}/login", json={"username": username, "password": password})
        assert r.status_code == 200, f"Login failed: {r.status_code}, {r.text}"
        token = r.json().get("token")

    assert token, "Auth failed to provide token"
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.get(f"{BASE_URL}/boards", headers=headers)
    assert r.status_code == 200, f"Get boards failed: {r.status_code}, {r.text}"
    boards = r.json()
    assert isinstance(boards, list), "Boards response is not a list"
    print(f"Fetched {len(boards)} boards successfully.")


if __name__ == "__main__":
    wait_for_service(f"{BASE_URL}/health", "Backend")
    wait_for_service(FRONTEND_URL, "Frontend")
    test_frontend_root()
    test_health_check()
    test_signup_and_login()
    test_get_boards()
    print("All E2E tests passed successfully.")

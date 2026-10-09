import requests

def test_user_constraints_flow():
    base_url = "http://localhost:5000/api"
    print("Testing user registration and persistent constraints lifecycle...")

    # 1. Register a brand new test user
    import time
    test_email = f"user_{int(time.time())}@example.com"
    reg_res = requests.post(f"{base_url}/auth/register", json={
        "email": test_email,
        "password": "securepassword123",
        "full_name": "Test User",
        "role": "candidate"
    })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    token = reg_res.json()["token"]
    user_data = reg_res.json()["user"]
    print(f"[OK] New user registered: {test_email}")

    # 2. Verify all initial constraints are 0 for a new user
    headers = {"Authorization": f"Bearer {token}"}
    cons_res = requests.get(f"{base_url}/user/constraints", headers=headers)
    assert cons_res.status_code == 200, f"Get constraints failed: {cons_res.text}"
    constraints = cons_res.json()["constraints"]
    print(f"[OK] Initial constraints for new user: {constraints}")
    for key, val in constraints.items():
        assert val == 0, f"Expected {key} to initially be 0, got {val}"
    print("[OK] Verified: All initial constraints strictly set to 0!")

    # 3. Save modified constraints to user's account
    updated_constraints = {
        "min_match_score": 75,
        "min_experience_years": 3,
        "skill_gap_threshold": 2,
        "salary_expectation_k": 120,
        "required_skills_weight": 85
    }
    save_res = requests.post(f"{base_url}/user/constraints", headers=headers, json={
        "constraints": updated_constraints
    })
    assert save_res.status_code == 200, f"Save constraints failed: {save_res.text}"
    print(f"[OK] Saved custom constraints to account: {save_res.json()['constraints']}")

    # 4. Simulate a future login and verify constraints are restored
    login_res = requests.post(f"{base_url}/auth/login", json={
        "email": test_email,
        "password": "securepassword123"
    })
    assert login_res.status_code == 200, f"Future login failed: {login_res.text}"
    restored_token = login_res.json()["token"]
    restored_user = login_res.json()["user"]
    print(f"[OK] Future login successful for {test_email}")
    assert restored_user["constraints"] == updated_constraints, "Restored user constraints mismatch!"

    # Also verify via GET endpoint with new token
    verify_res = requests.get(f"{base_url}/user/constraints", headers={"Authorization": f"Bearer {restored_token}"})
    assert verify_res.status_code == 200
    for k, v in updated_constraints.items():
        assert verify_res.json()["constraints"][k] == v, f"Expected {k} to be {v}"
    print(f"[OK] Constraints restored from database on future login: {verify_res.json()['constraints']}")

    print("\nALL CONSTRAINTS LIFECYCLE TESTS PASSED!")

if __name__ == "__main__":
    test_user_constraints_flow()

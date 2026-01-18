def test_login_invalid(client):
    # Attempt to login with invalid credentials -> expect 401 or error message
    resp = client.post('/api/auth/login', json={'email': 'noone@test', 'password': 'wrong'})
    assert resp.status_code in (400, 401, 404)
    data = resp.get_json()
    assert data is not None
    assert 'error' in data or resp.status_code != 200

def test_root(client):
    resp = client.get('/')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('status') == 'running'
    assert 'endpoints' in data

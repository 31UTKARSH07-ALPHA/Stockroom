PRODUCT = {"sku": "STK-001", "name": "Desk Lamp", "category": "Lighting", "quantity": 12, "price": "29.99"}


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_metrics_endpoint(client):
    client.get("/health")
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "stockroom_http_requests_total" in response.text


def test_create_and_list_products(client):
    created = client.post("/api/products", json=PRODUCT)
    assert created.status_code == 201
    assert created.json()["sku"] == PRODUCT["sku"]
    listed = client.get("/api/products")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_get_product_and_missing_product(client):
    product_id = client.post("/api/products", json=PRODUCT).json()["id"]
    assert client.get(f"/api/products/{product_id}").json()["name"] == PRODUCT["name"]
    assert client.get("/api/products/999").status_code == 404


def test_update_product(client):
    product_id = client.post("/api/products", json=PRODUCT).json()["id"]
    updated = {**PRODUCT, "name": "Desk Lamp Pro", "quantity": 8}
    response = client.put(f"/api/products/{product_id}", json=updated)
    assert response.status_code == 200
    assert response.json()["name"] == "Desk Lamp Pro"
    assert response.json()["quantity"] == 8


def test_delete_product(client):
    product_id = client.post("/api/products", json=PRODUCT).json()["id"]
    assert client.delete(f"/api/products/{product_id}").status_code == 204
    assert client.get(f"/api/products/{product_id}").status_code == 404

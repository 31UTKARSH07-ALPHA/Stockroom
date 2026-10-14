from time import perf_counter

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import get_db
from .models import Product
from .schemas import ProductCreate, ProductRead, ProductUpdate

app = FastAPI(title="Stockroom API", version="0.1.0")
REQUEST_COUNT = Counter(
    "stockroom_http_requests_total",
    "HTTP requests handled by Stockroom",
    ("method", "route", "status_code"),
)
REQUEST_DURATION = Histogram(
    "stockroom_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ("method", "route"),
)


@app.middleware("http")
async def collect_request_metrics(request: Request, call_next):
    if request.url.path == "/metrics":
        return await call_next(request)

    started = perf_counter()
    response = await call_next(request)
    route = request.scope.get("route")
    route_name = route.path if route is not None else request.url.path
    REQUEST_COUNT.labels(request.method, route_name, str(response.status_code)).inc()
    REQUEST_DURATION.labels(request.method, route_name).observe(perf_counter() - started)
    return response


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/ready")
def ready(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {"status": "ready"}


@app.get("/metrics", include_in_schema=False)
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/api/products", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)):
    return db.scalars(select(Product).order_by(Product.id.desc())).all()


@app.post("/api/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A product with this SKU already exists") from exc
    db.refresh(product)
    return product


@app.get("/api/products/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.put("/api/products/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A product with this SKU already exists") from exc
    db.refresh(product)
    return product


@app.delete("/api/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

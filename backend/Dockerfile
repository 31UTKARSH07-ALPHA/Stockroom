FROM python:3.12-slim AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1
WORKDIR /build
COPY requirements.txt .
RUN pip wheel --wheel-dir /wheels -r requirements.txt

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/stockroom/.local/bin:${PATH}"
WORKDIR /app
RUN groupadd --system --gid 10001 stockroom \
    && useradd --system --uid 10001 --gid stockroom --create-home stockroom
COPY --from=builder /wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels
COPY --chown=stockroom:stockroom app ./app
COPY --chown=stockroom:stockroom alembic ./alembic
COPY --chown=stockroom:stockroom alembic.ini ./alembic.ini
COPY --chown=stockroom:stockroom docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod 0555 ./docker-entrypoint.sh
USER 10001:10001
EXPOSE 8000
ENTRYPOINT ["./docker-entrypoint.sh"]

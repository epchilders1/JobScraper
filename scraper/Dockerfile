FROM python:3.13-slim

WORKDIR /app

# Copy schema first (needed for prisma generate)
COPY prisma/schema.prisma prisma/schema.prisma

# Copy scraper source
COPY scraper/ scraper/

WORKDIR /app/scraper

RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

# Download the Linux query-engine binary and regenerate the Python client
RUN prisma generate --schema=/app/prisma/schema.prisma

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "server:app"]

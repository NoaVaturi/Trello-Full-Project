FROM python:3.9-slim-bookworm

USER root
RUN apt-get update && apt-get upgrade -y && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN groupadd --gid 1000 appgroup && useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

USER appuser

# Copy the Flask application files into the container
COPY --chown=appuser:appgroup . .

# Set environment variable for Python to not buffer stdout/stderr
ENV PYTHONUNBUFFERED=1


ENTRYPOINT ["python"]
CMD ["-m", "flask", "run", "--host=0.0.0.0"]


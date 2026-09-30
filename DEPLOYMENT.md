# SpringAI-GIS Production Deployment Guide (MVP-AC-058, MVP-AC-059)

## 1. System Architecture
```text
Client Browser (HTTPS :443)
       │
       ▼
Nginx Reverse Proxy & SSL Termination
       │
  ┌────┴───────────────────────────────┐
  │                                    │
  ▼                                    ▼
Static Frontend (Vite Build)     Django / Express API (:3000)
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
      PostgreSQL 16 + PostGIS 3.4 (:5432)        Redis 7 Caching & Broker (:6379)
                                                          │
                                                          ▼
                                                  Celery Spatial Worker Pool
```

## 2. Environment Configuration (MVP-AC-002)
Copy the template configuration without hardcoding secrets:
```bash
cp .env.example .env
```

Ensure variables are set:
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://springai_user:springai_secret@postgres:5432/springai_gis
REDIS_URL=redis://redis:6379/0
DJANGO_SETTINGS_MODULE=config.settings
JWT_SECRET=production-secret-generate-with-openssl
```

## 3. Docker Deployment Procedure (MVP-AC-001, MVP-AC-058)
Execute clean orchestration:
```bash
docker compose -f docker-compose.yml up --build -d
```

Verify service health:
```bash
docker compose ps
```
Expected output:
```text
NAME                     STATUS          PORTS
springai_web             Up (healthy)    0.0.0.0:3000->3000/tcp
springai_postgres        Up (healthy)    0.0.0.0:5432->5432/tcp
springai_redis           Up (healthy)    0.0.0.0:6379->6379/tcp
springai_celery_worker   Up (healthy)    
```

## 4. Verification & Health Probes (MVP-AC-060)
Verify liveness and readiness:
```bash
curl -f http://localhost:3000/health
# Returns: {"status":"UP","database":"CONNECTED","redis":"CONNECTED","celery":"OPERATIONAL"}

curl -f http://localhost:3000/ready
# Returns: {"status":"READY","services":{"postgis":true,"redis":true,"celery_worker":true,"ml_inference_engine":true}}
```

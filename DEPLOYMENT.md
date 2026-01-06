# Deployment Guide

This guide covers deploying the Intent-Based Healthcare Platform.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Git

## Quick Start with Docker Compose

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd intent-healthcare-monorepo
   ```

2. **Deploy all services**:
   ```bash
   cd infra
   docker-compose up -d
   ```

3. **Access the services**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

4. **View logs**:
   ```bash
   docker-compose logs -f
   ```

5. **Stop services**:
   ```bash
   docker-compose down
   ```

## Building Individual Services

### Backend Only

```bash
cd backend
docker build -t intent-backend .
docker run -p 8000:8000 intent-backend
```

### Frontend Only

```bash
cd frontend/web
docker build -t intent-frontend .
docker run -p 3000:80 intent-frontend
```

## Development Mode

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend/web
npm install
npm run dev
```

## Environment Variables

### Backend

- `PYTHONPATH`: Set to `/app` in Docker (already configured)

### Frontend

- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:8000`)

To customize in docker-compose, edit the `environment` section in `infra/docker-compose.yml`.

## Kubernetes Deployment

For Kubernetes deployment, see the configuration files in `infra/k8s/`. You'll need to:

1. Complete the Kubernetes manifests (currently basic structure only)
2. Apply the configurations:
   ```bash
   kubectl apply -f infra/k8s/
   ```

## Production Considerations

1. **Environment Variables**: Use `.env` files or secrets management
2. **HTTPS**: Configure reverse proxy (nginx/traefik) with SSL certificates
3. **Database**: Currently uses in-memory storage; consider persistent database
4. **Monitoring**: Add logging, metrics, and health checks
5. **Scaling**: Adjust replica counts in docker-compose or Kubernetes
6. **Security**: Review and harden security configurations

## Troubleshooting

### Port Already in Use

If ports 8000 or 3001 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Use 8001 instead of 8000 for backend
  - "3002:80"    # Use 3002 instead of 3001 for frontend
```

### Backend Connection Issues

Ensure the frontend's `VITE_API_BASE_URL` matches your backend URL. In Docker Compose, services can communicate using service names (e.g., `http://backend:8000`).

### Build Failures

- Ensure Docker is running
- Check Dockerfile paths are correct
- Verify all required files exist (requirements.txt, package.json, etc.)


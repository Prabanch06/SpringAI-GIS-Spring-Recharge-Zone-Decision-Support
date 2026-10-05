# GitHub Actions to EC2 Deployment

This project can build and publish its web and Celery worker Docker images to GitHub Container Registry (GHCR) whenever a commit is pushed to `main`. If the EC2 GitHub Actions settings below are configured, the same workflow also updates the running app. The public web port is **3001** (container port 3000).

## 1. Prepare the EC2 instance

Use Amazon Linux 2023 with at least 8 GB RAM and 30 GB disk for the GIS/ML images. In the EC2 security group:

- Allow SSH (TCP 22) only from your IP.
- Allow TCP 3001 from the addresses that need to view the app.
- Do not add inbound rules for PostgreSQL (5432) or Redis (6379); Compose keeps these services private.

Install and enable Docker:

```bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

Log out and back in for the Docker group change, then verify:

```bash
docker --version
docker compose version
```

Create the deployment directory and its private environment file:

```bash
sudo mkdir -p /opt/springai-gis
sudo chown ec2-user:ec2-user /opt/springai-gis
cd /opt/springai-gis
umask 077
nano .env
```

Set these values in `.env` (generate new random secrets; never commit this file):

```dotenv
POSTGRES_PASSWORD=replace-with-a-long-random-database-password
DJANGO_SECRET_KEY=replace-with-a-long-random-django-secret
ALLOWED_HOSTS=your-ec2-public-ip
# Optional:
GEMINI_API_KEY=
VITE_CARTO_API_KEY=
```

Save the file, then ensure it is only readable by the EC2 user:

```bash
chmod 600 .env
```

## 2. Push the project to GitHub

From your local project directory, commit and push to `main`:

```bash
git add .
git commit -m "Set up EC2 Docker deployment"
git push origin main
```

GitHub Actions runs `npm ci`, the TypeScript check, and the frontend build. On a successful push to `main`, it builds and publishes the `web` and `backend` images to GHCR.

## 3. Make the GHCR packages public

The EC2 instance pulls the images without a registry credential, so make both packages public after the first successful workflow run:

1. Open the repository's GitHub **Packages** section.
2. Open the web package and the package ending in `-backend`.
3. In each package's **Package settings**, change visibility to **Public**.

## 4. Enable automatic deployment from GitHub

In the repository's **Settings → Secrets and variables → Actions**, add these repository variables:

- `EC2_HOST`: the EC2 public IPv4 address or DNS name.
- `EC2_USER`: `ec2-user` for the default Amazon Linux account.

Add this repository secret:

- `EC2_SSH_KEY`: the private SSH key corresponding to a public key authorized for `ec2-user` on that instance. Do not paste the private key into source files or chat.

The workflow uploads `docker-compose.prod.yml` and runs `docker compose pull` and `docker compose up` on the EC2 instance after each successful push to `main`. The `/opt/springai-gis` directory and `.env` file must already exist.

## 5. Verify the live deployment

After the workflow succeeds, check the instance:

```bash
cd /opt/springai-gis
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 web celery_worker
curl -i http://localhost:3001/health
```

Open `http://<EC2-public-IP>:3001` in a browser. The current `/health` endpoint only confirms that the Express process responds; review the container status and logs for database, Redis, or Celery problems.

## Notes

- The site is served over HTTP on port 3001. Before using it for sensitive or general public traffic, configure a domain and HTTPS reverse proxy/load balancer on ports 80/443.
- PostgreSQL data and Redis data persist in Docker volumes. Back up the database volume/data regularly before upgrading or changing the instance.
- If the GHCR packages are private, configure registry read access on EC2 before enabling deployment.

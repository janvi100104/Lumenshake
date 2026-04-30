# CI/CD Setup Guide

This project now includes a GitHub Actions workflow at:

- `.github/workflows/CI.yaml`

## What the Pipeline Does

### CI (Pull Requests + Push to `main`)

1. **Backend CI**
   - Installs backend dependencies
   - Runs JavaScript syntax checks
   - Starts a PostgreSQL service
   - Runs DB migrations
   - Runs backend smoke checks (`/health`, `/metrics`, MoneyGram exchange-rate endpoint)

2. **Web CI**
   - Installs web dependencies
   - Runs `npm run lint`
   - Runs `npm run build`

3. **Smart Contract CI**
   - Runs Rust tests for:
     - `contracts/payroll_contract`
     - `contracts/test_usdc`

### CD (Push to `main` only)

4. **Publish backend Docker image to GHCR**
   - Builds `backend/Dockerfile`
   - Pushes image to:
     - `ghcr.io/<owner>/<repo>/backend:main`
     - `ghcr.io/<owner>/<repo>/backend:sha-<commit>`
     - `ghcr.io/<owner>/<repo>/backend:latest` (default branch)

## Required GitHub Repository Settings

1. **Actions permissions**
   - Keep workflow permissions enabled (read repository contents).
   - `CI.yaml` requests `packages: write` only for the CD image-publish job.

2. **Package visibility (GHCR)**
   - In GitHub Packages settings, ensure your repo can publish container images.
   - First successful CD run will create the package in GHCR.

3. **Branch protection (recommended for production)**
   - Protect `main`.
   - Require status checks to pass before merge:
     - `Backend CI`
     - `Web CI`
     - `Smart Contracts CI`

## Optional Next Step: Deploy Environments

Current CD publishes a production-ready backend image artifact.  
To complete full deployment automation, add one or both:

1. **Web auto-deploy** (e.g., Vercel on push to `main`)
2. **Backend runtime deploy** (e.g., AWS ECS, Fly.io, Render, Railway, Kubernetes) using the GHCR image

If you want, we can add the provider-specific deployment job next (with OIDC/secrets and environment approvals).

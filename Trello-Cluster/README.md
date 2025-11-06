# ☸️ Trello Cluster – Kubernetes Deployment

This repository contains the Kubernetes manifests and Helm charts required to deploy the Trello App via ArgoCD using the **App of Apps** pattern.  
It manages the complete infrastructure and application lifecycle on a Kubernetes cluster.

---

## 📦 Repository Structure

```
.
├── root/
│   ├── cluster-config/
│   │   ├── manifests/
│   │   │   ├── apps/           # ArgoCD App manifests (App of Apps)
│   │   │   ├── configmaps/     # MongoDB init and backend config
│   │   │   ├── secrets/        # MongoDB, backend, GitHub secrets
│   │   │   ├── namespace/      # Namespace manifest
│   │   │   └── storage/        # Storage class definition
│   └── apps/
│       ├── backend/            # Helm chart for Flask backend
│       ├── mongodb/            # Helm chart for MongoDB StatefulSet
│       └── nginx/              # Helm chart for Nginx ingress controller
```

---

## 🚀 Deployment Overview

This repo uses the **App of Apps** pattern with ArgoCD:

- `parent-app.yaml`: Defines a single ArgoCD Application pointing to this repo.
- Child apps:
  - `mongodb-app.yaml`
  - `backend-app.yaml`
  - `nginx-app.yaml`

Each child app references a Helm chart from `root/apps`.

---

## 🔁 How It Works

1. **ArgoCD parent app** (`parent-app.yaml`) bootstraps all other apps.
2. **Helm charts** deploy each component into the `trello-app` namespace.
3. **Secrets and ConfigMaps** are defined in `manifests/secrets` and `manifests/configmaps`.
4. **Ingress** is managed by Nginx (`nginx/templates/ingress.yaml`).
5. **Persistent storage** is configured via `storage-class.yaml`.

---

## ✅ Prerequisites

- A running Kubernetes cluster (e.g., EKS, Minikube)
- ArgoCD installed in the cluster
- Helm CLI installed
- `kubectl` configured for the target cluster

---

## 📥 Bootstrap the Deployment

1. From your **Terraform repository**, port-forward the ArgoCD server:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

2. Open your browser and go to:  
👉 [http://localhost:8080](http://localhost:8080)

3. Log in to ArgoCD.  
Since you've already configured a GitHub Personal Access Token (PAT) in `github-creds.yaml`, ArgoCD will automatically fetch and deploy all child apps (`mongodb`, `backend`, `nginx`).

---

## 🌐 Access the Application

Once deployed, access the Trello App from the web at:  
👉 [http://trello-app.ddns.net](http://trello-app.ddns.net)

---

## 🚀 Continuous Deployment Flow

This repository is automatically updated through a GitHub Actions workflow in the [`Trello-App`](https://github.com/NoaVaturi/Trello-App.git) repository.

When a new Docker image is built and pushed to AWS ECR, the final job in the CI/CD pipeline updates the backend Helm chart’s `values.yaml` file in this repository with the new image tag, and pushes it to the `main` branch.

ArgoCD then detects the change and automatically syncs the updated chart to your cluster, deploying the new version of the backend.

> 🔄 This enables a fully automated end-to-end deployment flow:  
> Code push → Image build → Tag update → ArgoCD sync → Live deployment

---

## 🔐 Managing Secrets

Secrets are stored as Kubernetes Secret manifests under:

- `manifests/secrets/mongodb-secret.yaml`
- `manifests/secrets/backend-secret.yaml`
- `manifests/secrets/github-creds.yaml`

> 💡 For production, consider using an external secrets manager like AWS Secrets Manager or HashiCorp Vault.

---

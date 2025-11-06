# 🧩 Trello Full DevOps Project

A full end-to-end DevOps pipeline for a microservices **Trello-like application**, built to demonstrate real-world CI/CD, Kubernetes orchestration, and Infrastructure-as-Code practices.

---

## 🏗️ Project Overview
This system automates the complete software lifecycle — from code commit to production deployment — using modern DevOps tools and cloud services.

---

## 🧰 Tech Stack

| Category | Technologies |
|-----------|---------------|
| **CI/CD** | GitHub Actions · Docker · ECR |
| **Orchestration** | Kubernetes (EKS) · Helm · ArgoCD |
| **Infrastructure** | Terraform (VPC, EKS, IAM) |
| **Languages** | Python · JavaScript · YAML · HCL |

---

## 📊 Architecture Diagram
<img src="https://github.com/user-attachments/assets/06ef7d86-a66d-44df-a509-ac1e5e203eda" alt="architecture diagram" width="1000" />

---

## 🚀 Workflow Summary

| Stage | Description |
|-------|--------------|
| 🧑‍💻 **Commit** | Developer pushes code to GitHub |
| ⚙️ **CI Build** | Unit tests and Docker image build |
| 📦 **Push to ECR** | Image uploaded to AWS ECR |
| ☸️ **Helm Deploy** | Application deployed to EKS cluster |
| 🔁 **ArgoCD Sync** | GitOps automation syncs new release |

---

## 📁 Repository Breakdown
| Repository | Description | Visibility |
|-------------|-------------|------------|
| 🔹 **[Trello-App](https://github.com/NoaVaturi/Trello-Full-Project/tree/main/Trello-App)** | App code (backend + frontend) with GitHub Actions CI (build, test, Docker, push to ECR; updates cluster chart tag)
| 🔹 **[Trello-Cluster](https://github.com/NoaVaturi/Trello-Full-Project/tree/main/Trello-Cluster)** | Helm charts + ArgoCD App-of-Apps (backend, mongodb, nginx ingress) in the `trello-app` namespace
| 🔹 **[Trello-Infrastructure](https://github.com/NoaVaturi/Trello-Full-Project/tree/main/Trello-Infrastructure)** | Terraform for AWS: VPC (public/private), EKS (managed node groups), IAM roles, ArgoCD bootstrap

---

## 📸 Screenshots & Demo

| Section | Preview |
|----------|----------|
| **ArgoCD UI (Deployed Apps)** | ![argocd-ui](https://github.com/user-attachments/assets/fce78f8e-cff1-493f-a216-028203e65069) |
| **Running Application** | <img width="1792" height="949" alt="web-prev" src="https://github.com/user-attachments/assets/b0456dd5-ad5f-492b-96e6-0a59ee70df67" /><br>🎥 [**Watch Demo Video**](docs/web.mp4) |


---

## ⚙️ Key Features
| Feature | Description |
|----------|--------------|
| ✅ CI/CD Automation | Full pipeline from code commit to Kubernetes deployment |
| ✅ Environment-ready design | Current: single namespace; staging/prod planned |
| ✅ Infrastructure-as-Code | Reusable Terraform modules for AWS resources |
| ✅ GitOps Model | ArgoCD syncs deployments from Helm manifests |

---

## 🧠 Challenges & Learnings
| Challenge | Solution |
|------------|-----------|
| Keeping secrets safe across environments | Used Kubernetes Secrets & AWS IAM roles instead of plaintext variables |
| GitOps structure with ArgoCD | Implemented the App-of-Apps pattern with correct chart paths and automatic sync |
| EKS authentication for GitHub Actions | Configured AWS credentials via GitHub Actions to interact with EKS and kubectl |
| Terraform state management | Currently local; plan to migrate to S3 backend with DynamoDB locking |

---

## 🧩 Tools Used
`AWS` · `Docker` · `Kubernetes` · `Helm` · `ArgoCD` · `Terraform` · `GitHub Actions` · `Python`

---

## 👩‍💻 Author
**Noa Vaturi**  
💼 [LinkedIn](https://linkedin.com/in/noa-vaturi) · 💻 [GitHub](https://github.com/NoaVaturi)

# 🧩 Trello Full DevOps Project

A full end-to-end DevOps pipeline for a microservices **Trello-like application**, built to demonstrate real-world CI/CD, Kubernetes orchestration, and Infrastructure-as-Code practices.

---

## 🏗️ Project Overview
This system automates the complete software lifecycle — from code commit to production deployment — using modern DevOps tools and cloud services.

---

## 🧰 Tech Stack

| Category | Technologies |
|-----------|---------------|
| **CI/CD** | Jenkins · GitHub Actions · Docker · ECR |
| **Orchestration** | Kubernetes (EKS) · Helm · ArgoCD |
| **Infrastructure** | Terraform (VPC, EKS, IAM, ALB) |
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
|-------------|--------------|-------------|
| 🔹 **[Trello-App](https://github.com/NoaVaturi/Trello-App)** | Backend + Frontend source, Dockerfiles, unit tests, and GitHub Actions CI | 🔒 Private |
| 🔹 **[Trello-Cluster](https://github.com/NoaVaturi/Trello-Cluster)** | Helm charts and ArgoCD App-of-Apps configuration for staging & prod | 🔒 Private |
| 🔹 **[Trello-Infrastructure](https://github.com/NoaVaturi/Trello-Infrastructure)** | Terraform code for AWS VPC, subnets, EKS, IAM, and ALB | 🔒 Private |

🧭 *Code is private due to sensitive credentials but available for review upon request.*

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
| ✅ Multi-Environment Setup | Separate staging & production namespaces |
| ✅ Infrastructure-as-Code | Reusable Terraform modules for AWS resources |
| ✅ GitOps Model | ArgoCD syncs deployments from Helm manifests |

---

## 🧠 Challenges & Learnings
| Challenge | Solution |
|------------|-----------|
| Keeping secrets safe across environments | Used Kubernetes Secrets & AWS IAM roles instead of plaintext variables |
| ArgoCD sync errors on Helm charts | Restructured App-of-Apps with proper chart paths |
| EKS context issues in Jenkins | Integrated kubeconfig with IAM role assumption |
| Terraform remote state conflicts | Implemented DynamoDB locking for concurrency safety |

---

## 📚 Related Template Repos
*(Coming soon – sanitized public versions of each module for learning use.)*

---

## 🧩 Tools Used
`AWS` · `Docker` · `Kubernetes` · `Helm` · `ArgoCD` · `Terraform` · `Jenkins` · `GitHub Actions` · `Python`

---

## 👩‍💻 Author
**Noa Vaturi**  
💼 [LinkedIn](https://linkedin.com/in/noavaturi) · 💻 [GitHub](https://github.com/NoaVaturi)

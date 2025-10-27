# 🧩 Trello Full DevOps Project

A full end-to-end DevOps pipeline for a microservices **Trello-like application**, built to demonstrate real-world CI/CD, Kubernetes orchestration, and Infrastructure-as-Code practices.

---

## 🏗️ Project Overview

This system automates the complete software lifecycle — from code commit to production deployment — using modern DevOps tools and cloud services.

**Tech Stack**
- **CI/CD:** Jenkins · GitHub Actions · Docker · ECR
- **Orchestration:** Kubernetes (EKS) · Helm · ArgoCD
- **Infrastructure:** Terraform (VPC, EKS, IAM, ALB)
- **Languages:** Python · React · YAML · HCL

---

## 📊 Architecture Diagram

<img width="1896" height="680" alt="diagram-architechture" src="https://github.com/user-attachments/assets/06ef7d86-a66d-44df-a509-ac1e5e203eda" />


---

## 🚀 Workflow Summary

1. **Code push →** triggers GitHub Actions / Jenkins pipeline  
2. **Build & Test →** Docker image built and unit-tested  
3. **Push →** image uploaded to AWS ECR  
4. **Deploy →** ArgoCD syncs Helm chart to AWS EKS

---

## 📁 Repository Breakdown

| Repository | Description | Status |
|-------------|-------------|---------|
| 🔹 **[Trello-App](https://github.com/NoaVaturi/Trello-App.git)** | Backend + Frontend source, Dockerfiles, unit tests, and GitHub Actions CI | *Private* |
| 🔹 **[Trello-Cluster](https://github.com/NoaVaturi/Trello-Cluster.git)** | Helm charts and ArgoCD App-of-Apps configuration for staging & prod | *Private* |
| 🔹 **[trello-Infrastructure](https://github.com/NoaVaturi/Trello-Infrastructure.git)** | Terraform code for AWS VPC, subnets, EKS, IAM, and ALB | *Private* |

🧭 *Code is private due to sensitive credentials, but available for review upon request.*

---

## 🧪 CI/CD Pipeline

[GitHub Commit]
      ↓
[Build & Unit Tests]
      ↓
[Docker Build & Push → ECR]
      ↓
[Helm Deploy → EKS]
      ↓
[ArgoCD Sync]



📸 Screenshots
ArgoCD UI (Deployed Apps)
![argocd-ui](docs/argocd-ui.png)

Running Application
🎥 Demo Video
[![Watch the demo](docs/web-demo.png)](docs/web.mp4)



⚙️ Key Features
✅ Fully automated CI/CD from commit to deployment
✅ Multi-environment setup (staging & production namespaces)
✅ Infrastructure-as-Code with reusable Terraform modules
✅ Helm + ArgoCD GitOps deployment model


🧠 Challenges & Learnings
| Challenge                                | Solution                                                       |
| ---------------------------------------- | -------------------------------------------------------------- |
| Keeping secrets safe across environments | Used K8s Secrets + AWS IAM roles instead of plaintext env vars |
| ArgoCD sync errors on Helm charts        | Fixed by restructuring App-of-Apps with correct paths          |
| EKS context issues in Jenkins            | Solved with kubeconfig and IAM role binding                    |
| Terraform remote state conflicts         | Added DynamoDB lock for safe concurrent runs                   |


📚 Related Template Repos  
*(Coming soon – sanitized public versions of each module)*


🧩 Tools Used
AWS · Docker · Kubernetes · Helm · ArgoCD · Terraform · Jenkins · GitHub Actions · Prometheus · Grafana · Python · React


🧑‍💻 Author
Noa Vaturi
💼 LinkedIn · 💻 GitHub

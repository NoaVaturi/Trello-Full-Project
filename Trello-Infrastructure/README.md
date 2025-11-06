# 🌐 Trello Infrastructure – Terraform on AWS

This repository provisions the complete AWS infrastructure for the Trello App using **Terraform** to manage all cloud resources.  
It sets up a secure, production-ready Kubernetes cluster with ArgoCD pre-installed, enabling GitOps deployment via the `Trello-Cluster` Git repository.

---

## 📦 What This Repo Manages

- ✅ VPC with public and private subnets  
- 🧠 EKS cluster and managed node groups  
- 🔐 IAM roles for EKS and workloads  
- 📦 StorageClass for EBS volumes  
- 🚀 ArgoCD installation via Helm  
- 📡 Ingress and DNS configuration  
- ⚙️ Kubernetes and Helm providers  

---

## 📁 File Structure

```
.
├── main.tf # Top-level module definitions
├── variables.tf # Input variable declarations
├── terraform.tfvars # Environment-specific values
├── outputs.tf # Output variables
├── versions.tf # Required provider versions
├── provider.tf # AWS, Kubernetes, and Helm providers
├── .terraform.lock.hcl # Provider version locking
└── modules/
├── vpc/ # VPC, subnets, and internet gateway
├── iam/ # IAM roles for EKS and workloads
├── eks/ # EKS cluster and node groups
├── argocd/ # ArgoCD Helm release
└── nginx-ingress/ # Nginx ingress controller (deployed via Helm release)
```

---

## 🚀 Getting Started

### ✅ Prerequisites

- [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) installed  
- AWS CLI installed and configured (`aws configure`)    
- GitHub PAT added to `github-creds.yaml` in your cluster repo (`Trello-Cluster`)

---

### 📥 Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the infrastructure
terraform apply
```

> ⏳ The initial `terraform apply` may take several minutes while EKS and node groups are provisioned.

---

## 🧭 Access ArgoCD UI

Once provisioning is complete, you can access the ArgoCD dashboard by port-forwarding:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then open your browser:  
👉 [http://localhost:8080](http://localhost:8080)

Log in using the default ArgoCD credentials or your configured admin password.

---

## 🌍 ArgoCD GitOps Flow

Once ArgoCD is installed, it pulls the `Trello-Cluster` repository and bootstraps the application deployment using the **App of Apps** pattern.

It deploys:
- `mongodb` via StatefulSet
- `backend` via Deployment
- `nginx` ingress controller

> 💡 Make sure your GitHub PAT is correctly set in `github-creds.yaml` so ArgoCD can sync from the repo.

---

## 🧹 Cleanup

To destroy all provisioned resources:

```bash
terraform destroy
```

---


# 📝 Trello-App

A full-stack Trello-like task management application featuring a React frontend, Flask backend with MongoDB, and Nginx as a reverse proxy.  
The application supports user authentication, project and task boards, GitHub integration, and visual progress tracking — all deployed via Docker and GitHub Actions CI/CD.

---

## 🚀 Features

- ✅ Trello-inspired board and card interface  
- 🔐 User authentication and authorization  
- 📁 Two default boards per user: **Work** and **Personal**  
- 📦 GitHub project links and visual progress bars in Work board  
- 📋 Lists for To-Do, In Progress, Done, and more  
- 💬 Card editing and drag-and-drop reordering  
- 🐳 Dockerized microservices architecture  
- 🔄 CI/CD via GitHub Actions  

---

## 🗂️ Project Structure

```
.
├── backend/                # Flask API with MongoDB integration
├── frontend/               # React frontend
├── nginx/                  # Nginx reverse proxy configuration
├── .github/workflows/      # GitHub Actions workflow
├── docker-compose.yml      # Dev & production orchestration
├── test_backend.py         # Unit tests for backend
└── e2e_tests.py            # End-to-end test script
```

---

## 🛠️ Tech Stack

- **Frontend**: React, JavaScript  
- **Backend**: Flask, Python  
- **Database**: MongoDB  
- **Infrastructure**: Docker, Nginx, GitHub Actions  
- **Tests**: Pytest (unit & e2e), `curl` health checks  

---

## 🧪 Running Locally

Make sure Docker and Docker Compose are installed.

```bash
# Clone the repository
git clone https://github.com/your-username/Trello-App.git
cd Trello-App
```

---

### ✅ Run Backend Unit Tests

Unit tests are focused **only on the backend** for simplicity and are executed as the **first step** in the GitHub Actions workflow (`.github/workflows/application.yml`).  
They run **outside the container** using Python and `pytest`.

To run them locally:

```bash
cd Trello-App

# Set up Python environment
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
pip install pytest

# Run the tests
pytest test_backend.py
```

---

### 🐳 Build and Start the Application

After unit testing, build and run the full application using Docker Compose:

```bash
docker compose up --build
```

Nginx will act as a reverse proxy and route traffic to the frontend and backend.

Once all services are up, open your browser and navigate to:  
👉 **http://localhost**

---

### 🔁 Run End-to-End Tests

Once the app is running, you can execute E2E tests to validate the full stack — including frontend, backend, MongoDB, and Nginx:

```bash
pytest e2e_tests.py
```

---

## ⚙️ CI/CD Pipeline

The GitHub Actions workflow is defined in `.github/workflows/application.yml` and includes the following steps:

1. ✅ Run backend unit tests  
2. 🐳 Build and push Docker images  
3. 🔁 Run end-to-end tests  
4. 🚀 Deploy to the production cluster (via a commit to the cluster GitOps repo)

> ⚠️ **Note**: For simplicity and performance, the workflow only pushes a new Docker tag for the **backend** container.  
> The frontend, MongoDB, and Nginx components are built and pushed only once during the initial deployment.  
> Subsequent CI/CD cycles update and deploy the backend image only.

---

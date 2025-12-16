# Zero Waste Challenge – Codebase

Welcome to the codebase of the **Zero Waste Challenge**, a gamified platform designed to promote sustainable living through personalized goals, community challenges, and collaborative efforts.

## 🚀 Project Video Recordings

1) [User Web Application](https://www.youtube.com/watch?v=_MOUUgUt5oI)
2) [Mobile Application](https://www.youtube.com/watch?v=m-UfFU4DWHM)

## 🚀 Project Overview

This repository contains the implementation of the Zero Waste Challenge platform, encompassing backend services, frontend interfaces, and supporting tools.

## 🛠️ Technologies Used

For detailed information, please refer to [Software Requirement Specifications](https://github.com/bounswe/bounswe2025group10/wiki/Project-%235-:-ZERO-WASTE-CHALLENGE#software-requirements-specification) page

## 📁 File Structure

** TO BE COMPLETED**

## 📄 Documentation

For detailed information on project requirements, design diagrams, and meeting notes, please refer to our [Project Wiki](https://github.com/bounswe/bounswe2025group10/wiki).


## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or later)
- npm (v8 or later)
- Docker (for local deployment)

---

# 1. Web Application (Backend + Frontend)

## Environment Variables

- Copy and adapt the following files:
  - `backend/.env.example` → `backend/.env` (create this file; see below for required variables)
  - `front-end/zero-waste/.env.production` (already provided, edit if needed)
  - `mobile/.env.example` → `mobile/.env`

### Example backend/.env.example
```
SECRET_KEY=your-django-secret-key
DEBUG=True
MYSQL_DATABASE=main_db
MYSQL_USER=admin
MYSQL_PASSWORD=123456789
MYSQL_ROOT_PASSWORD=123456789
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your-email-password
ALLOWED_HOSTS=localhost,127.0.0.1
```

---

## Development Setup (Docker Compose)

1. **Start all services:**
   ```bash
   docker compose up --build
   ```
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000

2. **Apply migrations and seed data:**
   Open a shell in the backend container:
   ```bash
   docker compose exec backend-web python manage.py migrate
   docker compose exec backend-web python manage.py create_badges
   docker compose exec backend-web python manage.py create_mock_data
   ```
   - This will create all required tables, badges, and mock/demo data.

3. **Default Test Users:**
   - Regular User:  
     - Username: `test_user`  
     - Password: `test123`  
     - Email: `test@gmail.com`
   - Admin User:  
     - Username: `admin`  
     - Password: `admin123`  
     - Email: `admin@example.com`

---

## Production Setup

- Adjust `.env` files for production (set `DEBUG=False`, use strong `SECRET_KEY`, set real email credentials, etc).
- Use a production-ready database and configure allowed hosts.
- Build and run with Docker Compose as above.

---

# 2. Frontend (Development)

1. Install dependencies:
   ```bash
   cd front-end/zero-waste
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
   - App runs at http://localhost:5173 (default)

---

# 3. Mobile Application

1. Copy and edit `mobile/.env.example` to `mobile/.env`.
2. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```
3. Start Metro bundler:
   ```bash
   npx react-native start
   ```
4. Start emulator or connect device, then run:
   ```bash
   npm run android
   # or
   npm run ios
   ```

---

# 4. Useful Docker Commands

- View running containers:
  ```bash
  docker ps
  ```
- Enter backend container shell:
  ```bash
  docker compose exec backend-web /bin/bash
  ```
- Stop all containers:
  ```bash
  docker compose down
  ```

---

# 5. Data Seeding & Reset

- To re-seed the database with mock/demo data:
  ```bash
  docker compose exec backend-web python manage.py create_badges
  docker compose exec backend-web python manage.py create_mock_data
  ```
- To reset the database, stop containers, remove volumes, and restart:
  ```bash
  docker compose down -v
  docker compose up --build
  # Then re-run the seeding commands above
  ```

---

# 6. Additional Notes

- The backend and frontend are fully containerized for local and production use.
- The backend mock data script creates a regular test user (`test_user`/`test123`) and at least one admin user.
- For more details, see the documentation and comments in each service's README.

---

For any issues, please refer to the [Project Wiki](https://github.com/bounswe/bounswe2025group10/wiki) or contact the maintainers.

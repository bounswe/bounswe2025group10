# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zero Waste Challenge - A gamified sustainability platform with Django REST backend and React Native mobile app. The main codebase is located in `/application/`.

## Directory Structure

```
/archive/application/
├── backend/     # Django REST API (Python 3.10, Django 5.2)
├── mobile/      # React Native app (TypeScript, React Native 0.79.2)
├── front-end/   # Web frontend
└── docs/        # Documentation
```

## Backend Development

### Quick Start with Docker (Recommended)
```bash
cd archive/application/backend
docker-compose up --build
# API runs at http://localhost:8000
# MySQL at localhost:3306
```

### Local Development
```bash
cd archive/application/backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Common Backend Commands
```bash
# Run tests
python manage.py test

# Run specific test file
python manage.py test api.tests.test_login

# Access Docker container
docker exec -it <container_name> /bin/bash

# Run migrations in Docker
docker compose exec web python manage.py migrate

# Deploy to production (preserves DB)
./deploy_save_db.sh

# Fresh deployment (destroys DB)
./deploy_destroy_db.sh
```

### Backend Architecture

**Django Apps:**
- `api/` - Main API endpoints (auth, posts, comments, waste, tips, achievements, profile, reports)
- `challenges/` - Challenge system
- `project/` - Settings and URL configuration

**API Endpoints Pattern:**
```
/login/, /signup/           - Authentication
/api/posts/                 - CRUD for posts
/api/posts/<id>/comments/   - Nested comments
/api/waste/                 - Waste tracking
/api/challenges/            - Challenge operations
/api/achievements/          - Achievement system
```

**Authentication:** JWT tokens (Simple JWT) with Token and Session fallback. Tokens stored in headers as `Authorization: Bearer <token>`.

**Testing:** Django TestCase with APIClient. Tests use in-memory SQLite. Test files in `api/tests/` and `challenges/tests.py`.

## Mobile Development

### Setup
```bash
cd archive/application/mobile
npm install

# iOS only (first time)
bundle install
bundle exec pod install
```

### Running the App
```bash
# Terminal 1: Start backend
cd archive/application/backend && docker-compose up --build

# Terminal 2: Start Metro
cd archive/application/mobile && npm start

# Terminal 3: Run app
npm run android  # or npm run ios
```

### Common Mobile Commands
```bash
# Run tests
npm test

# Lint code
npm run lint

# Build APK (Android)
cd android && ./gradlew assembleRelease
```

### Mobile Architecture

**Directory Structure:**
```
src/
├── context/     # AuthContext for global state
├── navigation/  # React Navigation setup
├── screens/     # Screen components
│   └── auth/    # Login/Signup screens
├── services/    # API services layer
└── utils/       # Storage, theme utilities
```

**Services:** All API calls go through service layer (`src/services/`):
- `authService` - Authentication
- `wasteService` - Waste tracking
- `challengeService` - Challenges
- `achievementService` - Achievements
- `profileService` - User profiles

**Navigation:** Bottom tabs (Home, Community, Challenges, Profile) with nested stack navigation for auth flow.

**State Management:** React Context API with AuthContext. Token persistence via AsyncStorage.

## Testing

### Backend Testing
```bash
# Run all tests
python manage.py test

# Run with verbose output
python manage.py test --verbosity=2

# Run specific app tests
python manage.py test api.tests
python manage.py test challenges
```

### Mobile Testing
```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## Important Notes

Do not change anything in archive/ or files that are not under application/mobile.

**Environment URLs:**
- Development Backend: `http://localhost:8000`
- Production Backend: `https://134-209-253-215.sslip.io`
- Mobile connects to backend via `src/services/api.ts` configuration

**Database:** MySQL 8.0 in Docker. Settings in `backend/project/settings.py`. Test database uses SQLite.

**File Uploads:** Media files stored in `/media/posts/<user_id>/`. Max size 5MB. Handled via MultiPartParser.

**CORS:** Currently allows all origins in development (django-cors-headers). Update for production.

**Authentication Flow:**
1. Mobile app calls `/login/` or `/signup/`
2. Backend returns JWT tokens
3. Mobile stores token in AsyncStorage
4. All subsequent requests include token in Authorization header
5. Backend validates token via Simple JWT middleware

**Deployment:** Uses Jenkins CI/CD pipeline. Deploy scripts in `backend/` directory handle production updates.
pipeline {
  // run on any available agent (or { label 'linux' } if that’s what yours is called)
  agent any

  environment {
    VENV_DIR = "${WORKSPACE}/application/backend/venv"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Prepare') {
      steps {
        dir('application/backend') {
          sh '''
            git pull
            if [ -f "${VENV_DIR}/bin/activate" ]; then
              source "${VENV_DIR}/bin/activate"
            fi
            chmod 644 ./sql/*.sql
          '''
        }
      }
    }

    stage('Build & Deploy') {
      steps {
        dir('application/backend') {
          sh '''
            docker compose down -v
            docker compose build
            lsof -ti:8000 | xargs -r kill -9 || true
            lsof -ti:3306 | xargs -r kill -9 || true
            docker compose up -d
          '''
        }
      }
    }

    stage('Migrate') {
      steps {
        dir('application/backend') {
          sh 'docker compose exec web python manage.py migrate'
        }
      }
    }
  }

  post {
    always { echo "Job finished at ${new Date().format("yyyy‑MM‑dd HH:mm:ss")}" }
  }
}

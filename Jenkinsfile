pipeline {
  agent {
    docker {
      // This image includes Docker cli & daemon
      image 'docker:24.0.5-dind'
      // Mount the host’s Docker socket so “docker compose” can talk to it
      args '-v /var/run/docker.sock:/var/run/docker.sock --privileged'
    }
  }

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
            git checkout backend
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

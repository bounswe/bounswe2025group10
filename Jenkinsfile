pipeline {
  agent any

  environment {
    // adjust if your venv lives elsewhere
    VENV_DIR = "${WORKSPACE}/application/backend/venv"
  }

  stages {
    stage('Checkout') {
      steps {
        // clone your repo; Jenkins will also pull on each run
        checkout([
          $class: 'GitSCM',
          branches: [[name: '*/main']],
          userRemoteConfigs: [[
            url: 'https://github.com/bounswe/bounswe2025group10.git',
            credentialsId: 'github‑ssh‑creds'
          ]]
        ])
      }
    }

    stage('Prepare') {
      steps {
        dir('application/backend') {
          // if you need a Python venv for any host‑side scripts
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
            # free up ports if something’s stuck
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
          // run Django migrations inside the web container
          sh 'docker compose exec web python manage.py migrate'
        }
      }
    }
  }

  post {
    always {
      echo "Job finished at ${new Date().format("yyyy‑MM‑dd HH:mm:ss")}"
    }
  }
}

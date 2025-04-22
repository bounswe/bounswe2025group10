pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Run Deploy Script') {
      steps {
        // 1) Ensure executable bit
        sh 'chmod +x application/backend/deploy.sh'

        // 2) Run it, capture output
        script {
          def raw = sh(
            script: './application/backend/deploy.sh',
            returnStdout: true
          ).trim()

          // 3) Define the grep pattern (adjust as needed)
          //    Here we look for any of your emoji-markers or the word Done
          def pat = ~/🔄|🐳|✅|🚀|📦|Done/

          // 4) Split into lines, filter, and echo each
          raw.readLines()
             .findAll { line -> line =~ pat }
             .each     { matched -> echo matched }
        }
      }
    }
  }

  post {
    success { echo '✅ Pipeline finished successfully.' }
    failure { echo '❌ Pipeline failed – check above logs!'  }
  }
}

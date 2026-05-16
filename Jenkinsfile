// Pipeline: CI — Frontend (ReactJS)
// Trigger: push / PR vào nhánh staging
// Stages: Install → Type Check → Lint → Build

pipeline {
    agent any

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '30'))
        disableConcurrentBuilds(abortPrevious: true)
    }

    tools {
        nodejs 'node-20'
    }

    stages {
        stage('Install') {
            steps {
                sh 'node --version && npm --version'
                sh 'npm ci'
            }
        }

        stage('Type Check') {
            steps {
                sh 'npx tsc --noEmit'
            }
        }

        stage('Lint') {
            steps {
                sh 'npx eslint . --max-warnings=0'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
    }

    post {
        success {
            echo "CI passed — staging build OK"
        }
        failure {
            echo "CI failed — kiểm tra log từng stage"
        }
        cleanup {
            cleanWs()
        }
    }
}

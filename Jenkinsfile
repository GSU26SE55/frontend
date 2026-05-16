// Pipeline: CI + Docker + Deploy — Frontend (ReactJS)
// Trigger: push / PR vào nhánh staging hoặc main
// Stages: Install → Type Check → Lint → Build → Docker Build & Push → Deploy
// Port:   staging → VPS:3000 | main → VPS:80

pipeline {
    agent any

    environment {
        IMAGE_NAME = "ghcr.io/gsu26se55/frontend"
        GH_USER    = 'gsu26se55'
        VPS_HOST   = '152.42.167.222'
        VPS_USER   = 'root'
    }

    options {
        timeout(time: 25, unit: 'MINUTES')
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

        stage('Docker Build & Push') {
            steps {
                script {
                    def branch = env.BRANCH_NAME ?: 'staging'
                    def shortSha = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()

                    def tags = []
                    if (branch == 'main') {
                        tags << "${env.IMAGE_NAME}:latest"
                        tags << "${env.IMAGE_NAME}:sha-${shortSha}"
                    } else {
                        tags << "${env.IMAGE_NAME}:staging"
                        tags << "${env.IMAGE_NAME}:sha-${shortSha}"
                    }

                    def tagArgs = tags.collect { "-t ${it}" }.join(' ')

                    withCredentials([string(credentialsId: 'GHCR_TOKEN', variable: 'TOKEN')]) {
                        sh "echo \${TOKEN} | docker login ghcr.io -u ${env.GH_USER} --password-stdin"
                        sh "docker build ${tagArgs} ."
                        tags.each { tag -> sh "docker push ${tag}" }
                        sh "docker logout ghcr.io"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def branch = env.BRANCH_NAME ?: 'staging'

                    // staging → port 3000, container name: frontend-staging
                    // main    → port 80,   container name: frontend-prod
                    def containerName = branch == 'main' ? 'frontend-prod'    : 'frontend-staging'
                    def imageTag      = branch == 'main' ? 'latest'            : 'staging'
                    def vpsPort       = branch == 'main' ? '80'                : '3000'

                    withCredentials([
                        string(credentialsId: 'GHCR_TOKEN', variable: 'TOKEN'),
                        sshUserPrivateKey(credentialsId: 'VPS_SSH_KEY', keyFileVariable: 'SSH_KEY')
                    ]) {
                        sh """
                            ssh -i \${SSH_KEY} -o StrictHostKeyChecking=no ${env.VPS_USER}@${env.VPS_HOST} \
                                "echo \${TOKEN} | docker login ghcr.io -u ${env.GH_USER} --password-stdin && \
                                docker pull ${env.IMAGE_NAME}:${imageTag} && \
                                docker stop ${containerName} 2>/dev/null || true && \
                                docker rm   ${containerName} 2>/dev/null || true && \
                                docker run -d \
                                    --name ${containerName} \
                                    --restart unless-stopped \
                                    -p ${vpsPort}:80 \
                                    ${env.IMAGE_NAME}:${imageTag} && \
                                docker logout ghcr.io && \
                                docker image prune -f"
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                def branch = env.BRANCH_NAME ?: 'staging'
                def url = branch == 'main'
                    ? 'http://capstonegsu26se55.mooo.com'
                    : 'http://capstonegsu26se55.mooo.com:3000'
                echo "Deploy thành công → ${url}"
            }
        }
        failure {
            echo "Pipeline thất bại — kiểm tra log từng stage"
        }
        cleanup {
            sh 'docker image prune -f || true'
            cleanWs()
        }
    }
}

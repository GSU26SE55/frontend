// Pipeline: CI + Docker + Deploy — Frontend (ReactJS)
// Trigger: push vào staging (từ dev→staging) hoặc main (từ staging→main)
// Stages: Install → Type Check → Build → Docker Build & Push → Deploy
// Internal port: staging → 127.0.0.1:3000 | main → 127.0.0.1:8081
// Public HTTPS is terminated by host Nginx + Certbot.

pipeline {
    agent any

    environment {
        IMAGE_NAME = "ghcr.io/gsu26se55/frontend"
        GH_USER    = 'gsu26se55'
        VPS_HOST   = '146.190.201.118'
        VPS_USER   = 'frontend'
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
        stage('Check Branch') {
            steps {
                script {
                    env.CURRENT_BRANCH = env.BRANCH_NAME
                    if (env.CURRENT_BRANCH != 'staging' && env.CURRENT_BRANCH != 'main') {
                        currentBuild.result = 'NOT_BUILT'
                        error("Branch '${env.CURRENT_BRANCH}' không được phép chạy CI/CD. Chỉ staging và main.")
                    }
                    echo "Branch hợp lệ: ${env.CURRENT_BRANCH}"
                }
            }
        }

        stage('Install') {
            steps {
                sh 'node --version && corepack enable && pnpm --version'
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Type Check') {
            steps {
                sh 'pnpm exec tsc --noEmit'
            }
        }

        stage('Build') {
            steps {
                withCredentials([file(credentialsId: 'FRONTEND_ENV_FILE', variable: 'FRONTEND_ENV')]) {
                    sh 'cp "$FRONTEND_ENV" .env'
                    sh 'pnpm build'
                    sh 'rm -f .env'
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    def branch = env.CURRENT_BRANCH
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

                    withCredentials([
                        string(credentialsId: 'GHCR_TOKEN', variable: 'TOKEN'),
                        file(credentialsId: 'FRONTEND_ENV_FILE', variable: 'FRONTEND_ENV')
                    ]) {
                        sh "echo \${TOKEN} | docker login ghcr.io -u ${env.GH_USER} --password-stdin"
                        sh "docker build --secret id=frontend_env,src=\${FRONTEND_ENV} ${tagArgs} ."
                        tags.each { tag -> sh "docker push ${tag}" }
                        sh "docker logout ghcr.io"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def branch = env.CURRENT_BRANCH

                    // staging → port 3000, container: frontend-staging
                    // main    → port 80,   container: frontend-prod
                    def containerName = branch == 'main' ? 'frontend-prod'    : 'frontend-staging'
                    def imageTag      = branch == 'main' ? 'latest'            : 'staging'
                    def vpsPort       = branch == 'main' ? '8081'              : '3000'

                    withCredentials([
                        string(credentialsId: 'GHCR_TOKEN', variable: 'TOKEN'),
                        sshUserPrivateKey(credentialsId: 'VPS_SSH_KEY', keyFileVariable: 'SSH_KEY')
                    ]) {
                        sh """
                            ssh -i \${SSH_KEY} -o StrictHostKeyChecking=no ${env.VPS_USER}@${env.VPS_HOST} \
                                "set -e; \
                                echo \${TOKEN} | docker login ghcr.io -u ${env.GH_USER} --password-stdin; \
                                docker pull ${env.IMAGE_NAME}:${imageTag}; \
                                docker rm -f ${containerName} 2>/dev/null || true; \
                                docker run -d \
                                    --name ${containerName} \
                                    --restart unless-stopped \
                                    -p 127.0.0.1:${vpsPort}:80 \
                                    ${env.IMAGE_NAME}:${imageTag}; \
                                curl --fail --silent --show-error --retry 10 --retry-delay 2 \
                                    http://127.0.0.1:${vpsPort}/ >/dev/null; \
                                docker logout ghcr.io; \
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
                def branch = env.CURRENT_BRANCH
                def url = branch == 'main'
                    ? 'https://solars.io.vn'
                    : 'https://staging.solars.io.vn'
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

// Pipeline: CI + Docker + Deploy — Frontend (ReactJS)
// Trigger: push vào staging (từ dev→staging) hoặc main (từ staging→main)
// Stages: Install → Type Check → Lint → Build → Docker Build & Push → Deploy
// Routing: main -> https://capstonegsu26se55.mooo.com, staging -> https://capstonegsu26se55.mooo.com:3443

pipeline {
    agent any

    environment {
        IMAGE_NAME = "ghcr.io/gsu26se55/frontend"
        GH_USER    = 'gsu26se55'
        VPS_HOST   = '152.42.167.222'
        VPS_USER   = 'root'
        K8S_NAMESPACE = 'solar-staging'
        FRONTEND_MANIFEST = 'deploy/k8s/frontend-web.yaml'
        VITE_API_BASE_URL = 'https://api.capstonegsu26se55.mooo.com'
        VITE_GOOGLE_CLIENT_ID = '85758470906-dhc3h3iiv52o77g7a8odqti5316j67cc.apps.googleusercontent.com'
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

        stage('Lint') {
            steps {
                sh 'pnpm exec eslint . --max-warnings=0'
            }
        }

        stage('Build') {
            steps {
                sh 'pnpm run build'
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

                    withCredentials([string(credentialsId: 'GHCR_TOKEN', variable: 'TOKEN')]) {
                        sh "echo \${TOKEN} | docker login ghcr.io -u ${env.GH_USER} --password-stdin"
                        sh "docker build --build-arg VITE_API_BASE_URL=${env.VITE_API_BASE_URL} --build-arg VITE_GOOGLE_CLIENT_ID=${env.VITE_GOOGLE_CLIENT_ID} ${tagArgs} ."
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

                    def deploymentName = branch == 'main' ? 'frontend-prod' : 'frontend-staging'
                    def imageTag       = branch == 'main' ? 'latest'        : 'staging'

                    withCredentials([
                        sshUserPrivateKey(credentialsId: 'VPS_SSH_KEY', keyFileVariable: 'SSH_KEY')
                    ]) {
                        sh """
                            ssh -i \${SSH_KEY} -o StrictHostKeyChecking=no ${env.VPS_USER}@${env.VPS_HOST} "kubectl apply -f -" < ${env.FRONTEND_MANIFEST}
                            ssh -i \${SSH_KEY} -o StrictHostKeyChecking=no ${env.VPS_USER}@${env.VPS_HOST} \
                                "kubectl -n ${env.K8S_NAMESPACE} set image deployment/${deploymentName} frontend=${env.IMAGE_NAME}:${imageTag} && \
                                kubectl -n ${env.K8S_NAMESPACE} rollout restart deployment/${deploymentName} && \
                                kubectl -n ${env.K8S_NAMESPACE} rollout status deployment/${deploymentName} --timeout=5m"
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
                    ? 'https://capstonegsu26se55.mooo.com'
                    : 'https://capstonegsu26se55.mooo.com:3443'
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

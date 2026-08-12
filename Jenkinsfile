// Pipeline: CI + Docker + Deploy — Frontend (ReactJS)
// Trigger: push vào staging (từ dev→staging) hoặc main (từ staging→main)
// Stages: Remote Docker Build & Deploy on the frontend VPS
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

        stage('Remote Build & Deploy') {
            steps {
                script {
                    def branch = env.CURRENT_BRANCH
                    def shortSha = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def remoteDir = "/tmp/frontend-${branch}-${env.BUILD_NUMBER}"
                    def remoteDockerConfig = "/tmp/frontend-docker-${branch}-${env.BUILD_NUMBER}"

                    def tags = []
                    if (branch == 'main') {
                        tags << "${env.IMAGE_NAME}:latest"
                        tags << "${env.IMAGE_NAME}:sha-${shortSha}"
                    } else {
                        tags << "${env.IMAGE_NAME}:staging"
                        tags << "${env.IMAGE_NAME}:sha-${shortSha}"
                    }

                    def tagArgs = tags.collect { "-t ${it}" }.join(' ')
                    def pushCommands = tags.collect { "docker push ${it}" }.join('\n')
                    def containerName = branch == 'main' ? 'frontend-prod' : 'frontend-staging'
                    def imageTag = branch == 'main' ? 'latest' : 'staging'
                    def vpsPort = branch == 'main' ? '8081' : '3000'

                    withCredentials([
                        string(credentialsId: 'GHCR_TOKEN', variable: 'TOKEN'),
                        file(credentialsId: 'FRONTEND_ENV_FILE', variable: 'FRONTEND_ENV'),
                        sshUserPrivateKey(credentialsId: 'VPS_SSH_KEY', keyFileVariable: 'SSH_KEY')
                    ]) {
                        sh """
                            set -eu
                            SOURCE_ARCHIVE=\$(mktemp /tmp/frontend-source.XXXXXX.tar.gz)
                            SSH_OPTS="-i \${SSH_KEY} -o StrictHostKeyChecking=no"

                            cleanup() {
                                rm -f "\${SOURCE_ARCHIVE}"
                                ssh \${SSH_OPTS} ${env.VPS_USER}@${env.VPS_HOST} \
                                    "rm -rf '${remoteDir}' '${remoteDockerConfig}'" || true
                            }
                            trap cleanup EXIT

                            git archive --format=tar.gz -o "\${SOURCE_ARCHIVE}" HEAD
                            ssh \${SSH_OPTS} ${env.VPS_USER}@${env.VPS_HOST} \
                                "rm -rf '${remoteDir}' '${remoteDockerConfig}'; \
                                 install -d -m 700 '${remoteDir}' '${remoteDockerConfig}'"
                            scp \${SSH_OPTS} "\${SOURCE_ARCHIVE}" \
                                ${env.VPS_USER}@${env.VPS_HOST}:'${remoteDir}/source.tar.gz'
                            scp \${SSH_OPTS} "\${FRONTEND_ENV}" \
                                ${env.VPS_USER}@${env.VPS_HOST}:'${remoteDir}/.env.ci'
                            ssh \${SSH_OPTS} ${env.VPS_USER}@${env.VPS_HOST} \
                                "tar -xzf '${remoteDir}/source.tar.gz' -C '${remoteDir}'; \
                                 rm -f '${remoteDir}/source.tar.gz'"

                            set +x
                            printf '%s' "\${TOKEN}" | ssh \${SSH_OPTS} ${env.VPS_USER}@${env.VPS_HOST} \
                                "umask 077; cat > '${remoteDir}/.ghcr-token'"
                            ssh \${SSH_OPTS} ${env.VPS_USER}@${env.VPS_HOST} "
                                set -eu
                                export DOCKER_CONFIG='${remoteDockerConfig}'
                                docker login ghcr.io -u '${env.GH_USER}' --password-stdin < '${remoteDir}/.ghcr-token'
                                rm -f '${remoteDir}/.ghcr-token'
                                cd '${remoteDir}'
                                docker build --secret id=frontend_env,src=.env.ci ${tagArgs} .
                                rm -f .env.ci
                                ${pushCommands}
                                docker rm -f '${containerName}' 2>/dev/null || true
                                docker run -d \
                                    --name '${containerName}' \
                                    --restart unless-stopped \
                                    -p '127.0.0.1:${vpsPort}:80' \
                                    '${env.IMAGE_NAME}:${imageTag}'
                                # The container may accept connections a moment after `docker run` returns.
                                # Poll briefly before the final assertion so a startup race does not fail deploy.
                                for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
                                    if curl --fail --silent --show-error --max-time 5 \
                                        'http://127.0.0.1:${vpsPort}/' >/dev/null; then
                                        break
                                    fi
                                    sleep 2
                                done
                                curl --fail --silent --show-error --max-time 5 \
                                    'http://127.0.0.1:${vpsPort}/' >/dev/null
                                docker logout ghcr.io
                                docker image prune -f
                            "
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
            cleanWs()
        }
    }
}

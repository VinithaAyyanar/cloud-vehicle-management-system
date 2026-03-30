pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    parameters {
        booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: 'Push image to Docker Hub')
        booleanParam(name: 'DEPLOY_STACK', defaultValue: true, description: 'Deploy application with Docker Compose after build')
        string(name: 'DOCKERHUB_NAMESPACE', defaultValue: 'your-dockerhub-username', description: 'Docker Hub namespace/user')
        string(name: 'APP_URL', defaultValue: 'http://localhost:5000', description: 'Application URL for deployment verification')
    }

    environment {
        APP_NAME = 'vehicle-management-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
        IMAGE_REPO = "${params.DOCKERHUB_NAMESPACE}/${APP_NAME}"
        IMAGE_LOCAL = "${APP_NAME}:${IMAGE_TAG}"
        IMAGE_REMOTE = "${params.DOCKERHUB_NAMESPACE}/${APP_NAME}:${IMAGE_TAG}"
        IMAGE_LATEST = "${params.DOCKERHUB_NAMESPACE}/${APP_NAME}:latest"
        VENV_DIR = '.venv'
        PYTEST_XML = 'backend/test-results.xml'
        DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
        APP_ENV_FILE_CREDENTIALS_ID = 'vehicle-app-env-file'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Clone') {
            steps {
                echo 'Cloning latest code from GitHub'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Installing Python dependencies'
                script {
                    if (isUnix()) {
                        sh '''
                            python3 -m venv ${VENV_DIR}
                            . ${VENV_DIR}/bin/activate
                            python -m pip install --upgrade pip
                            pip install -r backend/requirements.txt
                        '''
                    } else {
                        bat '''
                            python -m venv %VENV_DIR%
                            call %VENV_DIR%\\Scripts\\activate
                            python -m pip install --upgrade pip
                            pip install -r backend\\requirements.txt
                        '''
                    }
                }
            }
        }

        stage('Test') {
            steps {
                echo 'Running pytest test suite'
                script {
                    if (isUnix()) {
                        sh '''
                            . ${VENV_DIR}/bin/activate
                            pytest -q backend/tests --junitxml=${PYTEST_XML}
                        '''
                    } else {
                        bat '''
                            call %VENV_DIR%\\Scripts\\activate
                            pytest -q backend\\tests --junitxml=%PYTEST_XML%
                        '''
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/test-results.xml'
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "Building Docker image ${IMAGE_LOCAL}"
                script {
                    if (isUnix()) {
                        sh '''
                            docker build -t ${IMAGE_LOCAL} -t ${IMAGE_REPO}:latest -f backend/Dockerfile .
                        '''
                    } else {
                        bat '''
                            docker build -t %IMAGE_LOCAL% -t %IMAGE_REPO%:latest -f backend\\Dockerfile .
                        '''
                    }
                }
            }
        }

        stage('Docker Push') {
            when {
                expression { return params.PUSH_IMAGE }
            }
            steps {
                echo "Pushing image to Docker Hub: ${IMAGE_REMOTE}"
                withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin
                                docker tag ${IMAGE_LOCAL} ${IMAGE_REMOTE}
                                docker push ${IMAGE_REMOTE}
                                docker push ${IMAGE_LATEST}
                                docker logout
                            '''
                        } else {
                            bat '''
                                echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                                docker tag %IMAGE_LOCAL% %IMAGE_REMOTE%
                                docker push %IMAGE_REMOTE%
                                docker push %IMAGE_LATEST%
                                docker logout
                            '''
                        }
                    }
                }
            }
        }

        stage('Prepare Runtime Config') {
            when {
                expression { return params.DEPLOY_STACK }
            }
            steps {
                echo 'Preparing deployment environment file'
                withCredentials([file(credentialsId: "${APP_ENV_FILE_CREDENTIALS_ID}", variable: 'ENV_FILE')]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                cp "${ENV_FILE}" .env
                                test -f .env
                            '''
                        } else {
                            bat '''
                                copy /Y "%ENV_FILE%" ".env"
                                if not exist ".env" exit /b 1
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression { return params.DEPLOY_STACK }
            }
            steps {
                echo 'Deploying stack with Docker Compose'
                script {
                    if (isUnix()) {
                        sh '''
                            docker compose down || true
                            docker compose up -d --build
                        '''
                    } else {
                        bat '''
                            docker compose down
                            docker compose up -d --build
                        '''
                    }
                }
            }
        }

        stage('Verify Deployment') {
            when {
                expression { return params.DEPLOY_STACK }
            }
            steps {
                echo "Verifying application at ${params.APP_URL}"
                script {
                    if (isUnix()) {
                        sh '''
                            sleep 15
                            curl -f ${APP_URL}
                            docker compose ps
                        '''
                    } else {
                        bat '''
                            powershell -Command "Start-Sleep -Seconds 15; Invoke-WebRequest -UseBasicParsing %APP_URL% | Out-Null"
                            docker compose ps
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully. Build #${BUILD_NUMBER}"
        }
        failure {
            echo 'Pipeline failed. Collecting compose status for troubleshooting.'
            script {
                if (isUnix()) {
                    sh 'docker compose ps || true'
                } else {
                    bat 'docker compose ps'
                }
            }
        }
        always {
            archiveArtifacts allowEmptyArchive: true, artifacts: 'backend/test-results.xml, docker-compose.yml, backend/Dockerfile, backend/requirements.txt'
        }
    }
}

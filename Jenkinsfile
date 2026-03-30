pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        APP_ENV_FILE = 'C:\\jenkins_home\\secrets\\vehicle-app.env'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Clone') {
            steps {
                echo 'Cloning code from GitHub'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Installing dependencies'
                bat '''
                    python -m venv .venv
                    call .venv\\Scripts\\activate
                    python -m pip install --upgrade pip
                    pip install -r backend\\requirements.txt
                '''
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests'
                bat '''
                    call .venv\\Scripts\\activate
                    set PYTHONPATH=backend
                    pytest backend\\tests --junitxml=backend\\test-results.xml
                '''
            }
        }

        stage('Prepare Env') {
            steps {
                echo 'Preparing runtime environment file'
                bat '''
                    if exist ".env" del /f /q ".env"
                    if not exist "%APP_ENV_FILE%" (
                        echo Missing env file at %APP_ENV_FILE%
                        exit /b 1
                    )
                    copy /Y "%APP_ENV_FILE%" ".env"
                '''
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker image'
                bat '''
                    docker build -t vehicle-management-app:latest -f backend\\Dockerfile .
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application with Docker Compose'
                bat '''
                    docker compose down
                    docker compose up -d --build
                '''
            }
        }

        stage('Verify') {
            steps {
                echo 'Checking application health'
                bat '''
                    powershell -Command "Start-Sleep -Seconds 15; Invoke-WebRequest -UseBasicParsing http://localhost:5000 | Out-Null"
                    docker compose ps
                '''
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'backend/test-results.xml'
            archiveArtifacts allowEmptyArchive: true, artifacts: 'backend/test-results.xml'
        }
        success {
            echo 'Pipeline completed successfully'
        }
        failure {
            echo 'Pipeline failed. Check .env path, Docker access, and compose logs.'
            bat 'docker compose ps'
        }
    }
}

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    triggers {
        githubPush()
    }

    environment {
        PYTHONPATH = "backend"
        DATABASE_URL = "sqlite:///app.db"
        FLASK_APP = "backend/run.py"
    }

    stages {

        stage('Clone') {
            steps {
                echo 'Cloning repository...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Setting up virtual environment and installing dependencies...'
                bat '''
                    python -m venv .venv
                    call .venv\\Scripts\\activate
                    python -m pip install --upgrade pip
                    pip install -r backend\\requirements.txt
                '''
            }
        }

        stage('Run App (Detached)') {
            steps {
                echo 'Starting Flask app in background...'

                bat '''
                    call .venv\\Scripts\\activate

                    REM Kill any existing Flask app on port 5000 (ignore errors)
                    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
                        taskkill /PID %%a /F || echo "No permission / already stopped"
                    )

                    REM Start Flask app in background
                    start "" /B python backend\\run.py
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo 'Checking if application is live...'

                bat '''
                    timeout /t 5 > nul

                    curl http://127.0.0.1:5000 || (
                        echo "App not responding"
                        exit 1
                    )
                '''
            }
        }
    }

    post {
        success {
            echo '🎉 App is running successfully at http://127.0.0.1:5000'
        }
        failure {
            echo '❌ Pipeline failed. Check logs.'
        }
    }
}
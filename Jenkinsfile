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
        DATABASE_URL = "sqlite:///demo.db"
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
                echo 'Setting up Python environment...'
                bat '''
                    python -m venv .venv
                    call .venv\\Scripts\\activate
                    python -m pip install --upgrade pip
                    pip install -r backend\\requirements.txt
                '''
            }
        }

        stage('Run App') {
            steps {
                echo 'Starting Flask app (same as VS Code run)...'

                bat '''
                    call .venv\\Scripts\\activate

                    REM Start Flask app in background
                    start "" /B cmd /c "python backend\\run.py"
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo 'Checking if app is running...'

                bat '''
                    REM wait for server startup
                    ping 127.0.0.1 -n 6 > nul

                    REM check server response
                    curl http://127.0.0.1:5000 || exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: App is running at http://127.0.0.1:5000'
        }
        failure {
            echo 'FAILED: Check Jenkins logs'
        }
    }
}
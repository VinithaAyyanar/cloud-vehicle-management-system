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
                checkout scm
            }
        }

        stage('Build') {
            steps {
                bat '''
                    python -m venv .venv
                    call .venv\\Scripts\\activate
                    pip install -r backend\\requirements.txt
                '''
            }
        }

        stage('Run App (Detached)') {
            steps {
                echo 'Starting Flask app...'

                bat '''
                    call .venv\\Scripts\\activate

                    REM start app in background (NO kill logic)
                    start "" /B cmd /c "python backend\\run.py"
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo 'Checking app...'

                bat '''
                    ping 127.0.0.1 -n 6 > nul

                    curl http://127.0.0.1:5000 || exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS - App running at http://127.0.0.1:5000'
        }
        failure {
            echo 'FAILED - Check logs'
        }
    }
}
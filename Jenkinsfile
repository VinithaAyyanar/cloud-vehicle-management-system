pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    triggers {
        githubPush()
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
                echo 'Starting Flask in background'

                bat '''
                    call .venv\\Scripts\\activate
                    set PYTHONPATH=backend
                    set DATABASE_URL=sqlite:///app.db
                    set FLASK_APP=backend/run.py

                    start "" /B python backend\\run.py
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo 'Checking if app is live...'
                bat '''
                    timeout /t 5 > nul
                    curl http://127.0.0.1:5000 || exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'App is running successfully 🚀'
        }
        failure {
            echo 'Something failed ❌'
        }
    }
}
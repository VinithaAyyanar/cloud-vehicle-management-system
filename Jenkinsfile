pipeline {
    agent any

    options {
        timestamps()
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
                    pytest backend\\tests
                '''
            }
        }

        stage('Run App') {
            steps {
                echo 'Starting Flask app'
                bat '''
                    call .venv\\Scripts\\activate
                    set FLASK_APP=backend/run.py
                    flask run
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully'
        }
        failure {
            echo 'Pipeline failed'
        }
    }
}
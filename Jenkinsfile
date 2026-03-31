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

        stage('Prepare Env') {
            steps {
                echo 'Creating environment'
                bat '''
                    (
                        echo SECRET_KEY=jenkins-secret-key
                        echo JWT_SECRET_KEY=jenkins-jwt-secret-key-1234567890
                        echo DATABASE_URL=sqlite:///jenkins.db
                    ) > .env
                '''
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests'
                bat '''
                    call .venv\\Scripts\\activate
                    set PYTHONPATH=backend
                    set DATABASE_URL=sqlite:///jenkins.db
                    pytest backend\\tests
                '''
            }
        }

        stage('Run App') {
            steps {
                echo 'Starting Flask app (background)'
                bat '''
                    call .venv\\Scripts\\activate
                    set PYTHONPATH=backend
                    set DATABASE_URL=sqlite:///jenkins.db
                    set FLASK_APP=backend/run.py

                    start "" flask run --host=0.0.0.0 --port=5000
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
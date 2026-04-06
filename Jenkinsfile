pipeline {
    agent any

    options {
        timestamps()
    }

    stages {

        stage('Clone') {
            steps {
                echo 'Cloning repo...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Installing dependencies...'
                bat '''
                    python -m venv .venv
                    call .venv\\Scripts\\activate
                    pip install -r backend\\requirements.txt
                '''
            }
        }

        stage('Run App (LIVE MODE)') {
            steps {
                echo 'Starting Flask app (LIVE)...'

                bat '''
                    call .venv\\Scripts\\activate

                    set PYTHONPATH=backend
                    set DATABASE_URL=sqlite:///demo.db

                    python backend\\run.py
                '''
            }
        }
    }
}
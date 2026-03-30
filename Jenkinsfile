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
                echo 'Creating Jenkins runtime environment'
                bat '''
                    (
                        echo SECRET_KEY=jenkins-secret-key
                        echo JWT_SECRET_KEY=jenkins-jwt-secret-key-1234567890
                        echo JWT_EXPIRES_MIN=60
                        echo POSTGRES_USER=vehicle_user
                        echo POSTGRES_PASSWORD=vehicle_pass
                        echo POSTGRES_DB=vehicle_db
                        echo DATABASE_URL=sqlite:///jenkins.db
                    ) > .env
                '''
            }
        }

        stage('Test') {
            steps {
                echo 'Running test suite'
                bat '''
                    call .venv\\Scripts\\activate
                    set PYTHONPATH=backend
                    pytest backend\\tests --junitxml=backend\\test-results.xml
                '''
            }
        }

        stage('Smoke Verify') {
            steps {
                echo 'Running application smoke verification'
                bat '''
                    call .venv\\Scripts\\activate
                    set PYTHONPATH=backend
                    python backend\\smoke_run.py > backend\\smoke-output.txt
                    type backend\\smoke-output.txt
                    findstr /C:"register 201" backend\\smoke-output.txt
                    findstr /C:"login 200" backend\\smoke-output.txt
                    findstr /C:"create_vehicle 201" backend\\smoke-output.txt
                '''
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'backend/test-results.xml'
            archiveArtifacts allowEmptyArchive: true, artifacts: 'backend/test-results.xml, backend/smoke-output.txt, .env'
        }
        success {
            echo 'Pipeline completed successfully'
        }
        failure {
            echo 'Pipeline failed. Check test logs and smoke verification output.'
        }
    }
}

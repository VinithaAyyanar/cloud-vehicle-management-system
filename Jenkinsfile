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
                echo 'Setting up environment...'
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

                    REM Kill any existing app on port 5000 (ignore errors)
                    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
                        taskkill /PID %%a /F || echo "Ignore kill error"
                    )

                    REM Start Flask app properly in background
                    start "" /B cmd /c "python backend\\run.py"
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo 'Checking if app is live...'

                bat '''
                    REM wait for server to start
                    ping 127.0.0.1 -n 6 > nul

                    REM check server
                    curl http://127.0.0.1:5000 || exit 1
                '''
            }
        }
    }

    post {
        success {
            echo '🎉 SUCCESS: App is running at http://127.0.0.1:5000'
        }
        failure {
            echo '❌ FAILED: Check logs'
        }
    }
}
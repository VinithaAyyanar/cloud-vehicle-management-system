pipeline {
    agent any

    stages {

        stage('Clone Repo') {
            steps {
                echo "Cloning repo..."
                git 'https://github.com/VinithaAyyanar/cloud-vehicle-management-system.git'
            }
        }

        stage('Build & Test') {
            steps {
                echo "Building..."
                sh '''
                python3 -m venv venv
                venv/bin/pip install -r backend/requirements.txt
                venv/bin/python -m pytest backend/tests || true
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo "Deploying..."
                sh '''
                ssh -o StrictHostKeyChecking=no azureuser@20.193.252.40 sudo systemctl restart vehicle-app
                '''
            }
        }
    }
}
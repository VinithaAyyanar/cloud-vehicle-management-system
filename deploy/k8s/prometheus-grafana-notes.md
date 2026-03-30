# Prometheus and Grafana on Kubernetes

For classroom labs, the easiest route is Helm:

1. Install kube-prometheus-stack:
   `helm repo add prometheus-community https://prometheus-community.github.io/helm-charts`
   `helm install monitor prometheus-community/kube-prometheus-stack -n monitoring --create-namespace`
2. Add a `ServiceMonitor` for `vehicle-app` to scrape `/metrics`.
3. Open Grafana and add dashboard panels for:
   - Request rate
   - Error rate
   - Response latency
   - CPU and memory usage


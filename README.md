<br />
<br />

<p align="center">
<a href="https://ale.run/">
  <img src="https://files.cloudtype.io/logo/ale-wordmark-black.svg" width="160px" alt="Ale logo" />
</a>
</p>
<h3 align="center">A Fully Customizable Internal Developer Platform</h3>
<p align="center">A framework that enables a fully self-service environment for developers. <br />Build your team’s Internal Developer Platform more efficiently.</p>

<br />

# Ale Plugin for Apps

Ale Plugin for Apps

## Getting Started

<a href="https://docs.ale.run/" target="_blank">Read the documentation</a> or follow the steps below:

### 🔵 Supported Apps and OSS Project

- MySQL
- MariaDB
- PostgreSQL
- MongoDB
- Redis

<details>
  <summary><strong>View all the supported</strong></summary>

- InfluxDB
- Bookstack
- Ghost
- Jekyll
- Wiki.js
- WordPress
- Elasticsearch
- Kibana
- Flowise
- Grafana
- Kibana
- RabbitMQ
- MeiliSearch
- MetaBase
- Mongo Express
- PgAdmin
- phpMyAdmin
- Umami
- Uptime Kuma

</details>

### 📌 Requirements

- Node.js version 20 or higher
- Kubernetes cluster

### 🪄 Installation(Local)

1. Clone the project repository.

    ```bash
    git clone https://github.com/ale-run/plugin-apps
    ```

2. Navigate to the project directory and run the npm installation command.

    ```bash
    cd plugin-apps
    npm i
    ```

3. Run Ale with the built-in Ale Plugin for Application build and deployment.

    ```bash
    npm run dev
    ```

4. Select the target cluster for Ale.

    ```bash
    ? Select a Kubernetes context: (Use arrow keys)
      No Cluster Selected 
      orbstack 
    ❯ docker-desktop 
    (Move up and down to reveal more choices)
    ```

5. Access via the following address.

    - <http://localhost:9001>

### ⚙️ Configuration

1. Run the following commands to install the Nginx Ingress Controller

    ```bash
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml

    kubectl delete -A ValidatingWebhookConfiguration ingress-nginx-admission

    kubectl patch ingressclass nginx --type='merge' -p '{"metadata": {"annotations": {"ingressclass.kubernetes.io/is-default-class": "true"}}}'
    ```

2. Run the following command to install the Metrics Server:

    ```bash
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    ```

### ▶️ Run

1. Press the + button on the dashboard or use cmd+K (ctrl+K on Windows) and select the language or platform you wish to deploy in the popup window..

2. Enter the configuration values required (platform version, build artifact path, environment variables, ports, etc.) for deployment, then press the Deploy button.

3. After the deployment is complete, press the Connect button to access the service.

## Community support

For general help using Ale, please refer to [the official Ale documentation](https://docs.ale.run/).
For additional help, you can use one of these channels to ask a question:

- [Discord](https://discord.gg/wVafphzcRE)
- [YouTube Channel](https://www.youtube.com/@ale_run)

## Documentation

- [Ale docs](https://docs.ale.run/)

## License

See the [LICENSE](./LICENSE) file for licensing information.

import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:ollama');

const VERSIONS = {
  '0.6': '0.6',
  '0.5': '0.5'
};

export default class OllamaController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['0.6'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `ollama-data`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'ollama',
        type: ROUTE_TYPE.HTTP,
        service: 'ollama',
        servicePort: 11434
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'ollama',
        hostname: request.name,
        strategy: 'rolling',
        replicas: resources.replicas || 1,
        containers: [
          {
            name: 'ollama',
            image: `ollama/ollama:${version}`,
            env: [
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            // command: ['/bin/sh', '-c'],
            // args: ['ollama run deepseek-r1'],
            expose: [
              {
                protocol: 'http',
                port: 11434
              }
            ],
            mounts: [
              {
                volume: `ollama-data`,
                volumePath: 'data',
                path: '/root/.ollama'
              }
            ],
            limits: {
              cpu: resources.cpu || 0.3,
              memory: (resources.memory || 0.5) * 1024
            },
            shell: '/bin/bash',
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

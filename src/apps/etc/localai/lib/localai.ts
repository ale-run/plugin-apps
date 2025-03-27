import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:localai');

const VERSIONS = {
  '2.25': '2.25.0'
};

export default class LocalAIController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['2.25'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `localai-data`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'localai',
        type: ROUTE_TYPE.HTTP,
        service: 'localai',
        servicePort: 8080
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'localai',
        hostname: request.name,
        strategy: 'rolling',
        replicas: resources.replicas || 1,
        containers: [
          {
            name: 'localai',
            image: `localai/localai:v${version}-aio-cpu`,
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
                port: 8080
              }
            ],
            mounts: [
              {
                volume: `localai-data`,
                volumePath: 'data',
                path: '/build/models'
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

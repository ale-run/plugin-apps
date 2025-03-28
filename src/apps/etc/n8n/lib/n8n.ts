import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:n8n');

const versions = {
  '1.85': '1.85.4',
  '1.84': '1.84.3'
};

export default class N8nController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['1.85'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `n8n-data`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'n8n',
        type: ROUTE_TYPE.HTTP,
        service: 'n8n',
        servicePort: 5678
      }
    });

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];

    env.push({
      name: 'TZ',
      value: 'Asia/Seoul'
    });

    env.push({
      name: 'GENERIC_TIMEZONE',
      value: 'Asia/Seoul'
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'n8n',
        hostname: request.name,
        strategy: 'rolling',
        replicas: resources.replicas || 1,
        containers: [
          {
            name: 'n8n',
            image: `ghcr.io/n8n-io/n8n:${version}`,
            env,
            expose: [
              {
                protocol: 'http',
                port: 5678
              }
            ],
            mounts: [
              {
                volume: `n8n-data`,
                volumePath: 'data',
                path: '/home/node/.n8n'
              }
            ],
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 0.5) * 1024
            }
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

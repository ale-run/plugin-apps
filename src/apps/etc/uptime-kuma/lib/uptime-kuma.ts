import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:uptime-kuma');

const versions = {
  '1': '1'
};

export default class UptimeKumaController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['1'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `uptime-kuma-data`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'uptime-kuma',
        type: ROUTE_TYPE.HTTP,
        service: 'uptime-kuma',
        servicePort: 3001
      }
    });

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];

    env.push({
      name: 'TZ',
      value: 'Asia/Seoul'
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'uptime-kuma',
        hostname: request.name,
        strategy: 'rolling',
        replicas: resources.replicas || 1,
        containers: [
          {
            name: 'uptime-kuma',
            image: `louislam/uptime-kuma:${version}`,
            env,
            expose: [
              {
                protocol: 'http',
                port: 3001
              }
            ],
            mounts: [
              {
                volume: `uptime-kuma-data`,
                volumePath: 'data',
                path: '/app/data'
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

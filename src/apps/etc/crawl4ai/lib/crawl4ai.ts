import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:redis');

const versions = {
  '0.6.0rc1-r2': '0.6.0rc1-r2',
  'latest': 'latest'
};

export default class Crawl4AIController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`];

    if (!version) throw new Error(`unsupported redis version "${app.version}"`);

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];

    env.push({
      name: 'TZ',
      value: 'Asia/Seoul'
    });

    const specs = [];

    specs.push({
      type: 'route',
      spec: {
        name: 'crawl4ai',
        type: ROUTE_TYPE.HTTP,
        service: 'crawl4ai',
        servicePort: 11235
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'crawl4ai',
        hostname: request.name,
        containers: [
          {
            name: 'crawl4ai',
            image: `unclecode/crawl4ai:${version}`,
            env,
            expose: [
              {
                protocol: 'http',
                port: 11235
              }
            ],
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 0.5) * 1024
            },
            shell: '/bin/bash'
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

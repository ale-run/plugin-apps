import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:meilisearch');

const versions = {
  '1.13': '1.13.3'
};

export default class MeilisearchController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['1.13'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `meilisearch-data`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'meilisearch',
        type: ROUTE_TYPE.HTTP,
        service: 'meilisearch',
        servicePort: 7700
      }
    });

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-masterkey`,
        value: ''
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'meilisearch',
        hostname: request.name,
        strategy: 'rolling',
        replicas: resources.replicas || 1,
        containers: [
          {
            name: 'meilisearch',
            image: `getmeili/meilisearch:v${version}`,
            env: [
              {
                name: 'MEILI_ENV',
                value: `development`
              },
              {
                name: 'MEILI_MASTER_KEY',
                secret: `${request.name}-masterkey`
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            expose: [
              {
                protocol: 'http',
                port: 7700
              }
            ],
            mounts: [
              {
                volume: `meilisearch-data`,
                volumePath: 'data',
                path: '/meili_data'
              }
            ],
            limits: {
              cpu: resources.cpu || 0.3,
              memory: (resources.memory || 0.5) * 1024
            }
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

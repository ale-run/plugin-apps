import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:elasticsearch');

const VERSIONS = {
  '7': '7.10.1',
  '6': '6.8.23'
};

export default class ElasticsearchController extends ClusterAppController {
  public async deploy(): Promise<void> {
    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['7'];

    const specs = [];
    specs.push({
      type: 'volume',
      spec: {
        name: `elasticsearch-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'web',
        type: ROUTE_TYPE.HTTP,
        service: 'elasticsearch',
        servicePort: 9200
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'manage',
        type: ROUTE_TYPE.TCP,
        service: 'elasticsearch',
        servicePort: 9300
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'elasticsearch',
        hostname: request.name,
        containers: [
          {
            name: 'elasticsearch',
            image: `elasticsearch:${version}`,
            env: [{ name: 'discovery.type', value: 'single-node' }].concat(options.env || []),
            expose: [
              {
                protocol: 'tcp',
                port: 9200
              },
              {
                protocol: 'tcp',
                port: 9300
              }
            ],
            mounts: [
              {
                volume: `elasticsearch-volume`,
                path: '/usr/share/elasticsearch/data'
              },
              options.config && {
                path: `/usr/share/elasticsearch/config/elasticsearch.yml`,
                contents: options.config
              }
            ].filter((v) => v),
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 2) * 1024
            }
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

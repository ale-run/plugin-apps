import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:neo4j');

const VERSIONS = {
  '5.26': '5.26.1',
  '4.4': '4.4.40'
};

export default class Neo4jController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['5'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `neo4j-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'neo4j',
        type: ROUTE_TYPE.HTTP,
        service: 'neo4j',
        servicePort: 7474
      }
    });

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-user-password`,
        value: `neo4j/${options.password}`
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'neo4j',
        stateful: true,
        hostname: request.name,
        strategy: 'rolling',
        containers: [
          {
            name: 'neo4j',
            image: `neo4j:${app.version}`,
            env: [
              !options.authentication && {
                name: 'NEO4J_AUTH',
                value: `none`
              },
              {
                name: 'NEO4J_AUTH',
                secret: `${request.name}-user-password`
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            expose: [
              {
                protocol: 'tcp',
                port: 7474
              }
            ],
            mounts: [
              {
                volume: `neo4j-volume`,
                volumePath: 'data',
                path: '/data'
              }
            ],
            limits: {
              cpu: resources.cpu || 2,
              memory: (resources.memory || 2) * 1024
            }
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

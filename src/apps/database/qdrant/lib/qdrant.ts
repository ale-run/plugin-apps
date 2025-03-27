import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:qdrant');

const VERSIONS = {
  '1.13': '1.13.0',
  '1.12': '1.12.5'
};

export default class QdrantController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['1.13'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `qdrant-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'qdrant',
        type: ROUTE_TYPE.HTTP,
        service: 'qdrant',
        servicePort: 6333
      }
    });

    // specs.push({
    //   type: 'route',
    //   spec: {
    //     name: 'qdrant-grpc',
    //     type: 'grpc',
    //     service: 'qdrant-grpc',
    //     servicePort: 6334
    //   }
    // });

    // specs.push({
    //   type: 'secret',
    //   spec: {
    //     name: `${request.name}-apikey`,
    //     value: ''
    //   }
    // });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'qdrant',
        stateful: true,
        hostname: request.name,
        strategy: 'rolling',
        containers: [
          {
            name: 'qdrant',
            image: `qdrant/qdrant:v${version}-unprivileged`,
            env: [
              // {
              //   name: 'QDRANT__SERVICE__READ_ONLY_API_KEY',
              //   secret: `${request.name}-apikey`
              // },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            expose: [
              {
                protocol: 'tcp',
                port: 6333
              }
              // {
              //   protocol: 'tcp',
              //   port: 6334
              // }
            ],
            mounts: [
              {
                volume: `qdrant-volume`,
                volumePath: 'data',
                path: '/qdrant/storage'
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

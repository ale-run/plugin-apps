import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:mongo');

export default class MongoController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};
    const secretPrefix = request.name.split('.').join('_').split('-').join('_').toUpperCase();

    const specs = [];
    specs.push({
      type: 'volume',
      spec: {
        name: `mongo-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'mongo',
        type: ROUTE_TYPE.TCP,
        service: 'mongo',
        servicePort: 27017
      }
    });

    options.mongoexpress &&
      specs.push({
        type: 'route',
        spec: {
          name: 'mongo-express',
          type: ROUTE_TYPE.HTTP,
          service: 'mongo',
          servicePort: 8081
        }
      });

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-root-password`,
        value: options.rootpassword
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'mongo',
        stateful: true,
        hostname: request.name,
        strategy: 'recreate',
        containers: [
          {
            name: 'mongo',
            image: `mongo:${app.version}`,
            env: [
              options.authentication && {
                name: 'MONGO_INITDB_ROOT_USERNAME',
                value: options.rootusername || 'root'
              },
              options.authentication && {
                name: 'MONGO_INITDB_ROOT_PASSWORD',
                secret: `${request.name}-root-password`
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ].filter((v) => v),
            expose: [
              {
                protocol: 'tcp',
                port: 27017
              }
            ],
            mounts: [
              {
                volume: `mongo-volume`,
                volumePath: 'data',
                path: '/data/db'
              }
            ],
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 0.5) * 1024
            },
            security: {
              runAsUser: 999,
              runAsGroup: 999
            },
            shell: options.authentication ? `mongo --username ${options.rootusername || 'root'} --password` : 'mongo'
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

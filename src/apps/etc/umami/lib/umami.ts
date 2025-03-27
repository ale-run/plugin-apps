import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:umami');

const versions = {
  '2.16': '2.16.1',
  '2.9': '2.9.0',
  '2.8': '2.8.0',
  '2.7': '2.7.0'
};

export default class UmamiController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['2.16'];

    if (!options.dbtype) throw new Error(`options.dbtype is required`);
    if (!~['postgresql', 'mysql'].indexOf(options.dbtype)) throw new Error(`options.dbtype must be either "mysql" or "postgresql".`);

    const specs = [];

    specs.push({
      type: 'route',
      spec: {
        name: 'umami',
        type: ROUTE_TYPE.HTTP,
        service: 'umami',
        servicePort: 3000
      }
    });

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-db-url`,
        value: `${options.dbtype}://${options.dbusername}:${options.dbpassword}@${options.dbhost}:${options.dbport}/${options.database}`
      }
    });

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-app-secret`,
        value: ''
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'umami',
        hostname: request.name,
        strategy: 'rolling',
        replicas: resources.replicas || 1,
        containers: [
          {
            name: 'umami',
            image: `ghcr.io/umami-software/umami:${options.dbtype}-v${version}`,
            env: [
              {
                name: 'DATABASE_URL',
                secret: `${request.name}-db-url`
              },
              {
                name: 'DATABASE_TYPE',
                value: `${options.dbtype}`
              },
              {
                name: 'APP_SECRET',
                secret: `${request.name}-app-secret`
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            expose: [
              {
                protocol: 'http',
                port: 3000
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

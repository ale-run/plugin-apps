import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:pgadmin');

const versions = {
  '9': '9.1'
};

export default class PgAdminController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['9'];

    const specs = [];

    specs.push({
      type: 'route',
      spec: {
        name: 'pgadmin',
        type: ROUTE_TYPE.HTTP,
        service: 'pgadmin',
        servicePort: 5050
      }
    });

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-admin-password`,
        value: options.adminpassword
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'pgadmin',
        hostname: request.name,
        containers: [
          {
            name: 'pgadmin',
            image: `dpage/pgadmin4:${version}`,
            env: [
              {
                name: 'PGADMIN_DEFAULT_EMAIL',
                value: options.adminemail
              },
              {
                name: 'PGADMIN_DEFAULT_PASSWORD',
                secret: `${request.name}-admin-password`
              },
              {
                name: 'PGADMIN_LISTEN_PORT',
                value: '5050'
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            expose: [
              {
                protocol: 'http',
                port: 5050
              }
            ],
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 0.5) * 1024
            }
          }
        ].filter((v) => v)
      }
    });

    await this.apply(specs);
  }
}

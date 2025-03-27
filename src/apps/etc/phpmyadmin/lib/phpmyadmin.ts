import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:phpmyadmin');

export default class PhpMyAdminController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const specs = [];

    specs.push({
      type: 'route',
      spec: {
        name: 'phpmyadmin',
        type: ROUTE_TYPE.HTTP,
        service: 'phpmyadmin',
        servicePort: 80
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
      type: 'secret',
      spec: {
        name: `${request.name}-user-password`,
        value: options.userpassword
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'phpmyadmin',
        hostname: request.name,
        containers: [
          {
            name: 'phpmyadmin',
            image: `phpmyadmin:5.2`,
            env: [
              {
                name: 'MYSQL_ROOT_PASSWORD',
                secret: `${request.name}-root-password`
              },
              {
                name: 'MYSQL_USER',
                value: options.username
              },
              {
                name: 'MYSQL_PASSWORD',
                secret: `${request.name}-user-password`
              },
              {
                name: 'PMA_HOST',
                value: options.dbhost
              },
              {
                name: 'PMA_PORT',
                value: options.dbport || `3306`
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            expose: [
              {
                protocol: 'http',
                port: 80
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

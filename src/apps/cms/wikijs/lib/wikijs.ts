import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:wikijs');

const VERSIONS = {
  '2': '2.5'
};

export default class BookstackController extends ClusterAppController {
  public async deploy(): Promise<void> {

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['2'];

    const specs = [];

    const route = {
      type: 'route',
      spec: {
        name: 'wikijs',
        type: ROUTE_TYPE.HTTP,
        service: 'wikijs',
        servicePort: 3000
      }
    };

    specs.push(route);

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-db-password`,
        value: options.dbpassword
      }
    });

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];

    env.push({
      name: 'DB_TYPE',
      value: `${options.dbtype}`
    });

    options.dbhost &&
      options.dbport &&
      env.push({
        name: 'DB_HOST',
        value: `${options.dbhost}`
      });

    options.dbport &&
      env.push({
        name: 'DB_PORT',
        value: `${options.dbport}`
      });

    options.dbusername &&
      env.push({
        name: 'DB_USER',
        value: `${options.dbusername}`
      });

    options.dbpassword &&
      env.push({
        name: 'DB_PASS',
        secret: `${request.name}-db-password`
      });

    options.database &&
      env.push({
        name: 'DB_NAME',
        value: `${options.database}`
      });

    env.push({
      name: 'TZ',
      value: options.tz || 'Asia/Seoul'
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'wikijs',
        hostname: request.name,
        strategy: 'rolling',
        containers: [
          {
            name: 'wikijs',
            image: `requarks/wiki:${version}`,
            env,
            expose: [
              {
                protocol: 'tcp',
                port: 3000
              }
            ],
            limits: {
              cpu: resources.cpu || 2,
              memory: (resources.memory || 0.5) * 4 * 1024
            }
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

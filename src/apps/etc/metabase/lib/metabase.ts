import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:metabase');

const versions = {
  '0.53': '0.53'
};

export default class MetabaseController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['0.53'];

    const specs = [];

    const route = {
      type: 'route',
      spec: {
        name: 'metabase',
        type: ROUTE_TYPE.HTTP,
        service: 'metabase',
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
      name: 'MB_DB_TYPE',
      value: `${options.dbtype}`
    });

    options.dbhost &&
      options.dbport &&
      env.push({
        name: 'MB_DB_HOST',
        value: `${options.dbhost}`
      });

    options.dbport &&
      env.push({
        name: 'MB_DB_PORT',
        value: `${options.dbport}`
      });

    options.dbusername &&
      env.push({
        name: 'MB_DB_USER',
        value: `${options.dbusername}`
      });

    options.dbpassword &&
      env.push({
        name: 'MB_DB_PASS',
        secret: `${request.name}-db-password`
      });

    options.database &&
      env.push({
        name: 'MB_DB_DBNAME',
        value: `${options.database}`
      });

    env.push({
      name: 'TZ',
      value: options.tz || 'Asia/Seoul'
    });

    env.push({
      name: 'JAVA_TIMEZONE',
      value: options.tz || 'Asia/Seoul'
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'metabase',
        stateful: true,
        hostname: request.name,
        strategy: 'rolling',
        containers: [
          {
            name: 'metabase',
            image: `metabase/metabase:v${version}`,
            env,
            expose: [
              {
                protocol: 'tcp',
                port: 3000
              }
            ],
            mounts: [],
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

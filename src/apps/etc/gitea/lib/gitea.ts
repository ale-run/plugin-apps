import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:gitea');

const VERSIONS = {
  '1.23': '1.23',
  '1.22': '1.22',
  '1.21': '1.21',
  '1.20': '1.20'
};

export default class GiteaController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['1.23'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `gitea-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    const route = {
      type: 'route',
      spec: {
        name: 'gitea',
        type: ROUTE_TYPE.HTTP,
        service: 'gitea',
        servicePort: 3000
      }
    };

    specs.push(route);

    !options.dbpassword &&
      options.dbhost &&
      specs.push({
        type: 'secret',
        spec: {
          name: `${options.dbhost}-root-password`
        }
      });

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];

    if (!env.find((e) => e.name === 'database__client')) {
      const dbclient = options.dbclient || 'mysql';
      if (!~['mysql', 'postgresql'].indexOf(dbclient)) throw new Error('options.dbclient must be either "mariadb/mysql" or "postgresql".');

      dbclient &&
        env.push({
          name: 'GITEA__database__DB_TYPE',
          value: dbclient
        });
      dbclient === 'mysql' &&
        options.dbhost &&
        env.push({
          name: 'GITEA__database__HOST',
          value: options.dbhost
        });
      dbclient === 'mysql' &&
        options.dbuser &&
        env.push({
          name: 'GITEA__database__USER',
          value: options.dbuser
        });
      dbclient === 'mysql' &&
        options.dbpassword &&
        env.push({
          name: 'GITEA__database__PASSWD',
          value: options.dbpassword,
          secret: !options.dbpassword && options.dbhost && `${options.dbhost}-root-password`
        });
      dbclient === 'mysql' &&
        options.database &&
        env.push({
          name: 'GITEA__database__NAME',
          value: options.database
        });
    }

    specs.push({
      type: 'service:container',
      spec: {
        name: 'gitea',
        hostname: request.name,
        containers: [
          {
            name: 'gitea',
            image: `gitea/gitea:${version}-rootless`,
            env: [{ name: 'discovery.type', value: 'single-node' }].concat(options.env || []),
            expose: [
              {
                protocol: 'http',
                port: 3000
              },
              {
                protocol: 'tcp',
                port: 2222
              }
            ],
            mounts: [
              {
                volume: `gitea-volume`,
                volumePath: 'data',
                path: '/var/lib/data'
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

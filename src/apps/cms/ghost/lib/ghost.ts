import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:ghost');


const versions = {
  5: '5.114.1',
  4: '4.48.9',
  3: '3.42.9'
};

export default class GhostController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;
    
    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['24'];

    const specs = [];
  
    if (!version) throw new Error(`unsupported ghost version "${app.version}"`);
  
    specs.push({
      type: 'volume',
      spec: {
        name: `ghost-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });
  
    const route = {
      type: 'route',
      spec: {
        name: 'ghost',
        type: ROUTE_TYPE.HTTP,
        service: 'ghost',
        servicePort: 2368
      }
    };
  
    specs.push(route);
    const url = options.url || (await this.evaluateServiceURL(route.spec));
  
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
  
    options.url &&
      env.push({
        name: 'url',
        value: url || options.url
      });
    options.mail_host &&
      env.push({
        name: 'mail__transport',
        value: 'SMTP'
      });
    options.mail_host &&
      env.push({
        name: 'mail__options__host',
        value: options.mail_host
      });
    options.mail_from &&
      env.push({
        name: 'mail__from',
        value: options.mail_from
      });
    options.mail_service &&
      env.push({
        name: 'mail__options__service',
        value: options.mail_service
      });
    options.mail_port &&
      env.push({
        name: 'mail__options__port',
        value: options.mail_port || 587
      });
    options.mail_user &&
      env.push({
        name: 'mail__options__auth__user',
        value: options.mail_user
      });
    options.mail_password &&
      env.push({
        name: 'mail__options__auth__pass',
        value: options.mail_password
      });
  
    if (!env.find((e) => e.name === 'database__client')) {
      const dbclient = options.dbclient || 'sqlite3';
      if (!~['sqlite3', 'mysql'].indexOf(dbclient)) throw new Error('options.dbclient must be either "sqlite3" or "mysql".');
  
      dbclient &&
        env.push({
          name: 'database__client',
          value: dbclient
        });
      dbclient === 'sqlite3' &&
        env.push({
          name: 'database__connection__filename',
          value: 'content/data/ghost.db'
        });
      dbclient === 'mysql' &&
        options.dbhost &&
        env.push({
          name: 'database__connection__host',
          value: options.dbhost
        });
      dbclient === 'mysql' &&
        options.dbuser &&
        env.push({
          name: 'database__connection__user',
          value: options.dbuser
        });
      dbclient === 'mysql' &&
        options.dbpassword &&
        env.push({
          name: 'database__connection__password',
          value: options.dbpassword,
          secret: !options.dbpassword && options.dbhost && `${options.dbhost}-root-password`
        });
      dbclient === 'mysql' &&
        options.database &&
        env.push({
          name: 'database__connection__database',
          value: options.database
        });
    }
  
    specs.push({
      type: 'service:container',
      spec: {
        name: 'ghost',
        replicas: resources.replicas || 1,
        hostname: request.name,
        containers: [
          {
            name: 'ghost',
            image: `ghost:${version}-alpine`,
            expose: [
              {
                protocol: 'http',
                port: 2368
              }
            ],
            env,
            mounts: [
              {
                volume: `ghost-volume`,
                volumePath: 'app',
                path: '/var/lib/ghost/content'
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
};

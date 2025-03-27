import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:pgvector');

export default class PgvectorController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};

    const specs = [];
    specs.push({
      type: 'volume',
      spec: {
        name: `pgvector-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'pgvector',
        type: ROUTE_TYPE.TCP,
        service: 'pgvector',
        servicePort: 5432
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
        name: 'pgvector',
        stateful: true,
        hostname: request.name,
        strategy: 'recreate',
        containers: [
          {
            name: 'pgvector',
            image: `pgvector/pgvector:pg${app.version}`,
            env: [
              {
                name: 'POSTGRES_USER',
                value: options.rootusername || 'root'
              },
              {
                name: 'POSTGRES_PASSWORD',
                secret: `${request.name}-root-password`
              },
              {
                name: 'POSTGRES_DB',
                value: options.database
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            security: {
              runAsNonRoot: false,
              runAsUser: 0,
              runAsGroup: 0
            },
            expose: [
              {
                protocol: 'tcp',
                port: 5432
              }
            ],
            mounts: [
              {
                volume: `pgvector-volume`,
                volumePath: 'data',
                path: '/var/lib/postgresql/data'
              },
              options.config && {
                path: `/etc/postgresql/postgresql.conf`,
                contents: options.config
              }
            ].filter((v) => v),
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 0.5) * 1024
            },
            // command: options.config && ['/bin/sh', '-c', 'chown -R 70:70 /var/lib/postgresql/data && chmod 750 -R /var/lib/postgresql/data && postgres -c config_file=/etc/postgresql/postgresql.conf'],
            // args: options.config && ['/bin/sh', '-c', 'chown -R 70:70 /var/lib/postgresql/data && chmod 750 -R /var/lib/postgresql/data && postgres -c config_file=/etc/postgresql/postgresql.conf'],
            shell: options.database ? `psql --host=127.0.0.1 --username ${options.rootusername || 'root'} --dbname ${options.database} --password` : `psql --host=127.0.0.1 --username ${options.rootusername || 'root'} --password`
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

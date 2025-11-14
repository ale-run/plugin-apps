import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:redis');

const versions = {
  8: '8.2',
  7: '7.4',
  6: '6.2',
  5: '5.0'
};

export default class RedisController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`];

    if (!version) throw new Error(`unsupported redis version "${app.version}"`);

    const disable_commands = [];
    if (options.disable_flushdb) disable_commands.push('FLUSHDB');
    if (options.disable_flushall) disable_commands.push('FLUSHALL');
    if (options.disable_config) disable_commands.push('CONFIG');

    const specs = [];
    specs.push({
      type: 'volume',
      spec: {
        name: `redis-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'redis',
        type: ROUTE_TYPE.TCP,
        service: 'redis',
        servicePort: 6379
      }
    });

    (options.password || options.auth === true) &&
      specs.push({
        type: 'secret',
        spec: {
          name: `${request.name}-password`,
          value: options.password
        }
      });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'redis',
        hostname: request.name,
        /*security: {
        fsGroup: 1001,
        fsGroupChangePolicy: "Always"
      },*/
        containers: [
          {
            name: 'redis',
            image: `bitnamilegacy/redis:${version}`,
            env: [
              options.auth === true
                ? {
                    name: 'REDIS_PASSWORD',
                    secret: `${request.name}-password`
                  }
                : {
                    name: 'ALLOW_EMPTY_PASSWORD',
                    value: 'yes'
                  },
              {
                name: 'REDIS_REPLICATION_MODE',
                value: 'master'
              },
              options.aof !== true && {
                name: 'REDIS_AOF_ENABLED',
                value: 'no'
              },
              disable_commands.length && {
                name: 'REDIS_DISABLE_COMMANDS',
                value: disable_commands.join(',')
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ].filter((v) => v),
            expose: [
              {
                protocol: 'tcp',
                port: 6379
              }
            ],
            security: {
              runAsUser: 1001,
              runAsGroup: 1001
            },
            mounts: [
              {
                volume: `redis-volume`,
                volumePath: 'data',
                path: '/bitnami/redis/data'
              },
              {
                volume: `redis-volume`,
                volumePath: 'tmp',
                path: '/opt/bitnami/redis/tmp'
              },
              {
                volume: `redis-volume`,
                volumePath: 'logs',
                path: '/opt/bitnami/redis/logs'
              },
              {
                name: `redis-volume`,
                volumePath: 'etc',
                path: `/opt/bitnami/redis/etc`
              }
            ],
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 0.5) * 1024
            },
            shell: 'redis-cli'
          }
        ]
      }
    });

    if (+resources.replicas > 1) {
      specs.push({
        type: 'service:container',
        spec: {
          name: 'redis-slave',
          replicas: +resources.replicas,
          hostname: `${request.name}-slave`,
          containers: [
            {
              name: 'redis',
              image: `bitnami/redis:${version}`,
              env: [
                options.auth === true
                  ? {
                      name: 'REDIS_PASSWORD',
                      secret: `${request.name}-password`
                    }
                  : {
                      name: 'ALLOW_EMPTY_PASSWORD',
                      value: 'yes'
                    },
                {
                  name: 'REDIS_REPLICATION_MODE',
                  value: 'slave'
                },
                {
                  name: 'REDIS_MASTER_HOST',
                  value: request.name
                },
                {
                  name: 'REDIS_MASTER_PASSWORD',
                  value: options.password
                },
                options.aof === false && {
                  name: 'REDIS_AOF_ENABLED',
                  value: 'no'
                },
                options.disable_commands && {
                  name: 'REDIS_DISABLE_COMMANDS',
                  value: options.disable_commands
                },
                {
                  name: 'TZ',
                  value: options.tz || 'Asia/Seoul'
                }
              ].filter((v) => v),
              expose: [
                {
                  protocol: 'tcp',
                  port: 6379
                }
              ],
              security: {
                allowPrivilegeEscalation: true,
                privileged: false,
                runAsNonRoot: false,
                runAsUser: 0,
                runAsGroup: 0
              },
              limits: {
                cpu: resources.cpu || 0.2,
                memory: (resources.memory || 0.5) * 1024
              }
            }
          ]
        }
      });
    }

    await this.apply(specs);
  }
}

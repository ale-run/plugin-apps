import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:kafka');

const versions = {
  '3.7': '3.7.0'
};

export default class KafkaController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['3.7'];

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];

    const specs = [];

    const svcs = await this.get('route', request.name);
    const svcmap =
      svcs &&
      svcs.reduce((o, svc) => {
        if (!svc || !svc.name || !(svc.name === request.name || svc.name.startsWith(`${request.name}-`))) return o;
        o[svc.name] = svc.entrypoints && svc.entrypoints[0];
        return o;
      }, {});

    const replicas = +resources.replicas || 1;
    if (replicas <= 0 || replicas % 2 === 0) throw new Error('replicas must be odd');

    const voters = ','
      .repeat(replicas - 1)
      .split(',')
      .map((v, index) => `${index}@$${request.name}-${index}:9093`);

    for (let index = 0; index < replicas; index++) {
      const hostname = `${request.name}-${index}`;
      const volumeName = `kafka-${index}-data`;
      const routeName = `kafka-${index}`;
      const externalName = svcmap[`${routeName}`];

      specs.push({
        type: 'volume',
        spec: {
          name: volumeName,
          size: `${resources.disk || 1}Gi`,
          mode: 'rwx'
        }
      });

      specs.push({
        type: 'route',
        spec: {
          name: routeName,
          type: ROUTE_TYPE.TCP,
          service: hostname,
          servicePort: 9094
        }
      });

      specs.push({
        type: 'service:container',
        spec: {
          name: hostname,
          hostname,
          strategy: 'recreate',
          replicas: 1,
          security: {
            runAsUser: 1001,
            runAsGroup: 1001,
            fsGroup: 1001
          },
          containers: [
            /*{
            init: true,
            name: 'kafka-init',
            image: `bitnami/kafka:${version}`,
            command: ['/bin/sh', '-c'],
            args: ['chown -R 1001:1001 /bitnami && chown -R 1001:1001 /opt/bitnami && ls -al /opt/bitnami && echo "done!"'],
            mounts: [
              {
                volume: volumeName,
                volumePath: 'kafka',
                path: '/bitnami/kafka'
              }
            ],
            security: {
              runAsUser: 0
            }
          },*/
            {
              name: 'kafka',
              image: `apache/kafka:${version}`,
              env: [
                ...env,
                {
                  name: 'KAFKA_HEAP_OPTS',
                  value: `-Xmx${Math.floor((resources.memory || 1) * 1024 * 0.5)}m -Xms256m`
                },
                {
                  name: 'KAFKA_NODE_ID',
                  value: `${index}`
                },
                {
                  name: 'CLUSTER_ID',
                  value: options.clusterid || request.name
                },
                {
                  name: 'KAFKA_PROCESS_ROLES',
                  value: 'controller,broker'
                },
                {
                  name: 'KAFKA_LISTENER_SECURITY_PROTOCOL_MAP',
                  value: 'CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT,PLAINTEXT:PLAINTEXT'
                },
                {
                  name: 'KAFKA_CONTROLLER_QUORUM_VOTERS',
                  value: voters.join(',')
                },
                {
                  name: 'KAFKA_LISTENERS',
                  value: 'PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094'
                },
                {
                  name: 'KAFKA_INTER_BROKER_LISTENER_NAME',
                  value: 'PLAINTEXT'
                },
                {
                  name: 'KAFKA_ADVERTISED_LISTENERS',
                  value: `PLAINTEXT://${hostname}:9092` + (externalName ? `,EXTERNAL://${externalName}` : `,EXTERNAL://${hostname}:9094`)
                },
                {
                  name: 'KAFKA_CONTROLLER_LISTENER_NAMES',
                  value: 'CONTROLLER'
                },
                {
                  name: 'KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR',
                  value: `${replicas}`
                },
                {
                  name: 'KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS',
                  value: '0'
                },
                {
                  name: 'KAFKA_TRANSACTION_STATE_LOG_MIN_ISR',
                  value: '1'
                },
                {
                  name: 'KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR',
                  value: '1'
                },
                {
                  name: 'KAFKA_AUTO_CREATE_TOPICS_ENABLE',
                  value: options.autocreatetopics === false ? 'false' : 'true'
                }
              ].filter((v) => v),
              expose: [
                {
                  protocol: 'tcp',
                  port: 9093
                },
                {
                  protocol: 'tcp',
                  port: 9092
                },
                {
                  protocol: 'tcp',
                  port: 9094
                }
              ],
              mounts: [
                {
                  volume: volumeName,
                  volumePath: 'kafka/data',
                  path: '/tmp/kafka-logs'
                },
                {
                  volume: volumeName,
                  volumePath: 'kafka/config',
                  path: '/opt/kafka/config'
                },
                {
                  volume: volumeName,
                  volumePath: 'kafka/logs',
                  path: '/opt/kafka/logs'
                }
              ],
              security: {
                runAsUser: 1001,
                runAsGroup: 1001,
                fsGroup: 1001
              },
              shell: '/bin/bash',
              limits: {
                cpu: resources.cpu || 0.2,
                memory: (resources.memory || 1) * 1024
              }
              /*
            probe: {
              startup: {
                tcpSocket: { port: 9093 },
                initialDelaySeconds: 10,
                failureThreshold: 100,
                periodSeconds: 10
              },
              liveness: {
                tcpSocket: {
                  port: 9093
                },
                initialDelaySeconds: 10,
                timeoutSeconds: 5,
                periodSeconds: 10,
                successThreshold: 1,
                failureThreshold: 3
              },
              readiness: {
                tcpSocket: {
                  port: 9093
                },
                initialDelaySeconds: 5,
                timeoutSeconds: 5,
                periodSeconds: 10,
                successThreshold: 1,
                failureThreshold: 6
              }
            },
            security: {
              capabilities: {
                drop: ['ALL']
              },
              runAsUser: 1001,
              runAsNonRoot: true,
              readOnlyRootFilesystem: true,
              allowPrivilegeEscalation: false
            },
            */
            }
          ]
        }
      });
    }
    await this.apply(specs);
  }
}

import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:zookeeper');

const versions = {
  '3.9': '3.9',
  '3.8': '3.8',
  '3.7': '3.7'
};

export default class ZookeeperController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['3.9'];
    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `zookeeper-data`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'zookeeper',
        type: ROUTE_TYPE.TCP,
        service: 'zookeeper',
        servicePort: 2181
      }
    });

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];

    env.push({
      name: 'TZ',
      value: 'Asia/Seoul'
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'zookeeper',
        hostname: request.name,
        strategy: 'rolling',
        replicas: resources.replicas || 1,
        containers: [
          {
            name: 'zookeeper',
            image: `zookeeper:${version}`,
            env,
            expose: [
              {
                protocol: 'tcp',
                port: 2181
              }
            ],
            mounts: [
              {
                volume: `zookeeper-data`,
                volumePath: 'data/data',
                path: '/data'
              },
              {
                volume: `zookeeper-data`,
                volumePath: 'data/datalog',
                path: '/datalog'
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

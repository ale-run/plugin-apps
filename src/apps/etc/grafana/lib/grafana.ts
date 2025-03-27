import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:grafana');

const versions = {
  '10': '10.3.1',
  '9': '9.5.15',
  '8': '8.5.27'
};

export default class GrafanaController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['10'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `grafana-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    const route = {
      type: 'route',
      spec: {
        name: 'grafana',
        type: ROUTE_TYPE.HTTP,
        service: 'grafana',
        servicePort: 3000
      }
    };

    specs.push(route);

    !options.adminpassword &&
      options.adminusername &&
      specs.push({
        type: 'secret',
        spec: {
          name: 'grafana-admin-password'
        }
      });

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];

    env.push({
      name: 'GF_SECURITY_ADMIN_USER',
      value: options.adminusername
    });
    env.push({
      name: 'GF_SECURITY_ADMIN_PASSWORD',
      value: options.adminpassword,
      secret: !options.dbpassword && options.dbhost && 'grafana-admin-password'
    });
    env.push({
      name: 'GF_SECURITY_ADMIN_EMAIL',
      value: options.adminemail
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'grafana',
        hostname: request.name,
        containers: [
          {
            name: 'grafana',
            image: `grafana/grafana-oss:${version}`,
            env: [{ name: 'discovery.type', value: 'single-node' }].concat(options.env || []),
            expose: [
              {
                protocol: 'http',
                port: 3000
              }
            ],
            mounts: [
              {
                volume: `grafana-volume`,
                volumePath: 'data',
                path: '/var/lib/grafana'
              }
            ].filter((v) => v),
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 1) * 1024
            }
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

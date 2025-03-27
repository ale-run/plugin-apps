import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:kibana');

const versions = {
  '7': '7.10.1',
  '6': '6.8.23'
};

export default class KibanaController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['0.7'];

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];

    const specs = [];
    
    specs.push({
      type: 'route',
      spec: {
        name: 'web',
        type: ROUTE_TYPE.HTTP,
        service: 'kibana',
        servicePort: 5601
      }
    });

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-password`,
        value: options.rootpassword
      }
    });

    const config = options.config || `server.host: 0.0.0.0`;

    specs.push({
      type: 'service:container',
      spec: {
        name: 'kibana',
        hostname: request.name,
        containers: [
          {
            name: 'kibana',
            image: `kibana:${version}`,
            env,
            expose: [
              {
                protocol: 'tcp',
                port: 5601
              }
            ],
            mounts: [
              {
                path: `/usr/share/kibana/config/kibana.yml`,
                contents: config
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

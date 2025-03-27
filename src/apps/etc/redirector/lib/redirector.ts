import { ClusterAppController, Logger, ROUTE_TYPE, BuildResult } from '@ale-run/runtime';
import path from 'path';
import fs from 'fs';
import template from 'es6-template-string';

const logger = Logger.getLogger('app:redirector');

export default class RedirectorController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.getRequest();
    const options = request.options || {};
    if (!options.redirect) throw new Error(`options.redirect is required`);

    const nginxtext = fs.readFileSync(path.join(__dirname, 'nginx.conf'), 'utf8');
    const nginxconf = template(nginxtext, { redirect: options.redirect });

    const specs = [];
    specs.push({
      type: 'route',
      spec: {
        name: 'redirector',
        type: ROUTE_TYPE.HTTP,
        service: 'redirector',
        servicePort: 80
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'redirector',
        hostname: request.name,
        replicas: 1,
        strategy: 'rolling',
        containers: [
          {
            name: 'redirector',
            image: `nginx:1.24-alpine`,
            expose: [
              {
                protocol: 'http',
                port: 80
              }
            ],
            mounts: [
              {
                path: `/etc/nginx/nginx.conf`,
                contents: nginxconf
              }
            ],
            resources: {
              requests: {
                cpu: 0.02,
                memory: 8
              },
              limits: {
                cpu: 0.02,
                memory: 16
              }
            }
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

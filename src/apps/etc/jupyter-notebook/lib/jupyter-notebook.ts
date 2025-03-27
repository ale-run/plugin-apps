import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:jupyter');

const VERSIONS = {
  '7': '7.0.3'
};

export default class JupyterController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['7'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `jupyter-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'jupyter-notebook',
        type: ROUTE_TYPE.HTTP,
        service: 'jupyter-notebook',
        servicePort: 8888
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'jupyter-notebook',
        hostname: request.name,
        containers: [
          {
            name: 'jupyter-notebook',
            image: `jupyter/minimal-notebook:notebook-${version}`,
            env: [],
            expose: [
              {
                protocol: 'http',
                port: 8888
              }
            ],
            // lifecycle: {
            //   start: {
            //     command: ['/bin/sh', '-c', 'start-notebook.sh', `--IdentityProvider.token=''`]
            //   }
            // },
            mounts: [
              {
                volume: `jupyter-volume`,
                volumePath: 'data',
                path: '/home/jovyan/work'
              }
            ],
            limits: {
              cpu: resources.cpu || 0.5,
              memory: (resources.memory || 1) * 1024
            }
            // command: ['/bin/bash', '-c'],
            // args: [
            //   'start-notebook.sh', `--IdentityProvider.token=''`
            // ],
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

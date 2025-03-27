import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:chroma');

const VERSIONS = {
  '0.6': '0.6.3',
  '0.5': '0.5.23',
  '0.4': '0.4.22'
};

export default class ChromaController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['0.6'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `chroma-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'chroma',
        type: ROUTE_TYPE.HTTP,
        service: 'chroma',
        servicePort: 8000
      }
    });

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-credential`,
        value: ''
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'chroma',
        stateful: true,
        hostname: request.name,
        strategy: 'rolling',
        containers: [
          {
            name: 'chroma',
            image: `chromadb/chroma:${version}`,
            env: [
              {
                name: 'IS_PERSISTENT',
                value: 'TRUE'
              },
              {
                name: 'CHROMA_SERVER_AUTH_CREDENTIALS',
                secret: `${request.name}-credential`
              },
              {
                name: 'CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER',
                value: 'chromadb.auth.token.TokenConfigServerAuthCredentialsProvider'
              },
              {
                name: 'CHROMA_SERVER_AUTH_PROVIDER',
                value: 'chromadb.auth.token.TokenAuthServerProvider'
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            expose: [
              {
                protocol: 'tcp',
                port: 8000
              }
            ],
            mounts: [
              {
                volume: `chroma-volume`,
                volumePath: 'data',
                path: '/chroma/chroma'
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

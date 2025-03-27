import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:coudchdb');

const VERSIONS = {
  '3': '3.4.2',
  '2': '2.3.1'
};

export default class CouchDBController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;
    const ctx = this;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = VERSIONS[`${app.version}`] || VERSIONS['3'];

    const specs = [];

    specs.push({
      type: 'volume',
      spec: {
        name: `couchdb-volume`,
        size: `${resources.disk || 1}Gi`,
        mode: 'rwx'
      }
    });

    specs.push({
      type: 'route',
      spec: {
        name: 'couchdb',
        type: ROUTE_TYPE.HTTP,
        service: 'couchdb',
        servicePort: 5984
      }
    });

    specs.push({
      type: 'secret',
      spec: {
        name: `${request.name}-user-password`,
        value: options.password
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'couchdb',
        stateful: true,
        hostname: request.name,
        strategy: 'recreate',
        containers: [
          {
            name: 'couchdb',
            image: `couchdb:${app.version}`,
            env: [
              {
                name: 'COUCHDB_USER',
                value: options.username
              },
              {
                name: 'COUCHDB_PASSWORD',
                secret: `${request.name}-user-password`
              },
              {
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
              }
            ],
            expose: [
              {
                protocol: 'tcp',
                port: 5984
              }
            ],
            mounts: [
              {
                volume: `couchdb-volume`,
                volumePath: 'data',
                path: '/opt/couchdb/data'
              }
            ],
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 0.5) * 1024
            },
            security: {
              allowPrivilegeEscalation: false,
              privileged: false,
              runAsNonRoot: true,
              runAsUser: 1000,
              runAsGroup: 1000
            }
            // shell: `curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_users && curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_replicator && curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_global_changes`,
            // lifecycle: {
            //   postStart: {
            //     exec: {
            //       command: [`curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_users && curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_replicator && curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_global_changes`]
            //     }
            //   }
            // },
          }
        ]
      }
    });

    await this.apply(specs);
  }
}

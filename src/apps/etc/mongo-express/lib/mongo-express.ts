import { ClusterAppController, Logger, ROUTE_TYPE } from '@ale-run/runtime';

const logger = Logger.getLogger('app:mongo-express');

const versions = {
  '1': '1.0',
};


export default class MongoExpressController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.request;

    const options = request.options || {};
    const resources = request.resources || {};
    const version = versions[`${app.version}`] || versions['1'];


  const specs = [];

  specs.push({
    type: 'route',
    spec: {
      name: 'mongo-express',
      type: ROUTE_TYPE.HTTP,
      service: 'mongo-express',
      servicePort: 8081
    }
  });

  specs.push({
    type: 'secret',
    spec: {
      name: `${request.name}-express-password`,
      value: options.expresspassword
    }
  });

  specs.push({
    type: 'secret',
    spec: {
      name: `${request.name}-db-password`,
      value: options.dbadminpassword
    }
  });


  specs.push({
    type: 'service:container',
    spec: {
      name: 'mongo-express',
      hostname: request.name,
      strategy: 'rolling',
      containers: [
        {
          name: 'mongo-express',
          image: `mongo-express:${version}`,
          env: [
            {
              name: 'ME_CONFIG_MONGODB_SERVER',
              value: options.dbhost
            },
            {
              name: 'ME_CONFIG_MONGODB_PORT',
              value: options.dbport
            }, {
              name: 'ME_CONFIG_BASICAUTH_USERNAME',
              value: options.expressusername
            }, {
              name: 'ME_CONFIG_BASICAUTH_PASSWORD',
              secret: `${request.name}-express-password`
            }, {
              name: 'ME_CONFIG_MONGODB_ADMINUSERNAME',
              value: options.dbadminusername
            }, {
              name: 'ME_CONFIG_MONGODB_ADMINPASSWORD',
              secret: `${request.name}-db-password`
            }, {
              name: 'TZ',
              value: options.tz || 'Asia/Seoul'
            }
          ],
          security: {
            runAsNonRoot: false,
            runAsUser: 0,
          },
          expose: [
            {
              protocol: 'tcp',
              port: 8081
            }
          ],
          limits: {
            cpu: resources.cpu || 0.2,
            memory: (resources.memory || 0.5) * 1024
          }
        },
      ]
    }
  });

  await this.apply(specs);
}
}

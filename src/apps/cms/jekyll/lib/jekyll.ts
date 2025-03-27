import { ClusterAppController, Logger, ROUTE_TYPE, BuildResult } from '@ale-run/runtime';
import path from 'path';
import fs from 'fs';
import template from 'es6-template-string';

const logger = Logger.getLogger('app:jekyll');

export default class JekyllController extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const app = this.app;
    const request = this.getRequest();
    const options = request.options || {};
    const resources = request.resources || {};

    const git = Object.assign({}, (request.context && request.context.git) || {}, (request.options && request.options.git) || {});
    if (!git || !git.url) throw new Error(`options.git is required`);

    let docbase = (options.docbase || '_site').split('\n').join('').split('\r').join('');
    while (docbase.startsWith('./')) docbase = docbase.substring(2);
    while (docbase.startsWith('/')) docbase = docbase.substring(1);

    const nginxtext = fs.readFileSync(path.join(__dirname, 'nginx.conf'), 'utf8');
    const nginxconf = template(nginxtext, { options });

    const buildenv =
      options.buildenv &&
      options.buildenv
        .filter((env) => env && env.name)
        .map((item) => item.name && `ENV ${item.name}="${item.value || ''}"`)
        .join('\n');
    const dockerfiletext = fs.readFileSync(path.join(__dirname, 'dockerfile'), 'utf8');
    const dockerfile = template(dockerfiletext, {
      app,
      npmrc: options.npmrc,
      nodeversion: options.nodeversion && options.nodeversion.split('\n').join(' '),
      npminstall: options.npminstall && options.npminstall.split('\n').join(' '),
      npmbuild: options.npmbuild && options.npmbuild.split('\n').join(' '),
      build: options.build && options.build.split('\n').join(' '),
      git,
      buildenv,
      nginxconf,
      docbase
    });

    const result: any = await this.build({
      repository: git,
      dockerfile: {
        text: dockerfile
      }
    });

    const targetImage = result.image.name;

    if (!targetImage) throw new Error(`build image was null`);

    if (options.env && !Array.isArray(options.env)) throw new Error('env must be an array');
    const env = options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v);

    const specs = [];
    specs.push({
      type: 'route',
      spec: {
        name: 'jekyll',
        type: ROUTE_TYPE.HTTP,
        service: 'jekyll',
        servicePort: 80
      }
    });

    specs.push({
      type: 'service:container',
      spec: {
        name: 'jekyll',
        hostname: request.name,
        replicas: resources.replicas || 1,
        sessionAffinity: true,
        strategy: options.strategy || 'rolling',
        containers: [
          {
            name: 'jekyll',
            image: targetImage,
            env,
            expose: [
              {
                protocol: 'http',
                port: 80
              }
            ],
            limits: {
              cpu: resources.cpu || 0.2,
              memory: (resources.memory || 0.1) * 1024
            },
            healthz: options.healthz
          }
        ]
      }
    });
    await this.apply(specs);
  }
}

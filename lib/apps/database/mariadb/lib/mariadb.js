"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const runtime_1 = require("@ale-run/runtime");
const logger = runtime_1.Logger.getLogger('app:mariadb');
class MariaDBController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const safemode = options.safemode === true;
            // const prevpwd = await ctx.getSecret(`${request.name}-root-password`);
            // console.log('prevpwd', prevpwd);
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `mariadb-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'mariadb',
                    type: runtime_1.ROUTE_TYPE.TCP,
                    service: 'mariadb',
                    servicePort: 3306
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-root-password`,
                    value: options.rootpassword
                }
            });
            options.database &&
                options.username &&
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
                    name: 'mariadb',
                    stateful: true,
                    hostname: request.name,
                    strategy: 'recreate',
                    containers: [
                        {
                            name: 'mariadb',
                            image: `mariadb:${app.version}`,
                            env: [
                                options.database && {
                                    name: 'MYSQL_DATABASE',
                                    value: options.database
                                },
                                options.database &&
                                    options.username && {
                                    name: 'MYSQL_USER',
                                    value: options.username
                                },
                                options.database &&
                                    options.username && {
                                    name: 'MYSQL_PASSWORD',
                                    secret: `${request.name}-user-password`
                                },
                                {
                                    name: 'MYSQL_ROOT_PASSWORD',
                                    secret: `${request.name}-root-password`
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ].filter((v) => v),
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 3306
                                }
                            ],
                            mounts: [
                                {
                                    volume: `mariadb-volume`,
                                    volumePath: 'data',
                                    path: '/var/lib/mysql'
                                },
                                options.config && {
                                    path: `/etc/mysql/my.cnf`,
                                    contents: options.config
                                }
                            ].filter((v) => v),
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 0.5) * 1024
                            },
                            security: {
                                runAsUser: 999,
                                runAsGroup: 999
                            },
                            // command: safemode === true && ['/bin/bash', '-c'],
                            // args: safemode === true && [
                            //   `mysqld_safe --skip-grant-tables`
                            // ],
                            shell: /^11\./.test(app.version) ? `mariadb -u root -p` : `mysql -u root -p`
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = MariaDBController;
//# sourceMappingURL=mariadb.js.map
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
const logger = runtime_1.Logger.getLogger('app:postgresql');
class PsqlController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `postgres-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'postgres',
                    type: runtime_1.ROUTE_TYPE.TCP,
                    service: 'postgres',
                    servicePort: 5432
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-root-password`,
                    value: options.rootpassword
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'postgres',
                    stateful: true,
                    hostname: request.name,
                    strategy: 'recreate',
                    containers: [
                        {
                            name: 'postgres',
                            image: `postgres:${app.version}-alpine`,
                            env: [
                                {
                                    name: 'POSTGRES_USER',
                                    value: options.rootusername || 'root'
                                },
                                {
                                    name: 'POSTGRES_PASSWORD',
                                    secret: `${request.name}-root-password`
                                },
                                {
                                    name: 'POSTGRES_DB',
                                    value: options.database
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            security: {
                                runAsUser: 0,
                                runAsGroup: 0
                            },
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 5432
                                }
                            ],
                            mounts: [
                                {
                                    volume: `postgres-volume`,
                                    volumePath: 'data',
                                    path: '/var/lib/postgresql/data'
                                },
                                options.config && {
                                    path: `/etc/postgresql/postgresql.conf`,
                                    contents: options.config
                                }
                            ].filter((v) => v),
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 0.5) * 1024
                            },
                            // command: options.config && ['/bin/sh', '-c', 'chown -R 70:70 /var/lib/postgresql/data && chmod 750 -R /var/lib/postgresql/data && postgres -c config_file=/etc/postgresql/postgresql.conf'],
                            // args: options.config && ['/bin/sh', '-c', 'chown -R 70:70 /var/lib/postgresql/data && chmod 750 -R /var/lib/postgresql/data && postgres -c config_file=/etc/postgresql/postgresql.conf'],
                            shell: options.database ? `psql --host=127.0.0.1 --username ${options.rootusername || 'root'} --dbname ${options.database} --password` : `psql --host=127.0.0.1 --username ${options.rootusername || 'root'} --password`
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = PsqlController;
//# sourceMappingURL=postgresql.js.map
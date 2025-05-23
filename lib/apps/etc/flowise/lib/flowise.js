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
const logger = runtime_1.Logger.getLogger('app:flowise');
const versions = {
    '2.2': '2.2.7',
    '2.1': '2.1.5',
    '2.0': '2.0.7',
    '1.8': '1.8.3',
    '1.7': '1.7.2',
    '1.6': '1.6.6',
    '1.5': '1.5.1',
    '1.4': '1.4.12'
};
class FloiwseController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = versions[`${app.version}`] || versions['2.2'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `flowise-data`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'flowise',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'flowise',
                    servicePort: 3000
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-admin-password`,
                    value: options.password
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-db-password`,
                    value: options.dbpassword
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'flowise',
                    hostname: request.name,
                    strategy: 'rolling',
                    replicas: resources.replicas || 1,
                    containers: [
                        {
                            name: 'flowise',
                            image: `flowiseai/flowise:${version}`,
                            env: [
                                {
                                    name: 'PORT',
                                    value: '3000'
                                },
                                {
                                    name: 'FLOWISE_USERNAME',
                                    value: `${options.username || 'admin'}`
                                },
                                {
                                    name: 'FLOWISE_PASSWORD',
                                    secret: `${request.name}-admin-password`
                                },
                                {
                                    name: 'DATABASE_TYPE',
                                    value: options.dbtype
                                },
                                {
                                    name: 'DATABASE_PORT',
                                    value: options.dbport
                                },
                                {
                                    name: 'DATABASE_HOST',
                                    value: options.dbhost
                                },
                                {
                                    name: 'DATABASE_NAME',
                                    value: options.dbname
                                },
                                {
                                    name: 'DATABASE_USER',
                                    value: options.dbusername
                                },
                                {
                                    name: 'DATABASE_PASSWORD',
                                    secret: `${request.name}-db-password`
                                },
                                {
                                    name: 'DATABASE_PATH',
                                    value: '/root/.flowise'
                                },
                                {
                                    name: 'DATABASE_PATH',
                                    value: '/root/.flowise'
                                },
                                {
                                    name: 'APIKEY_PATH',
                                    value: '/root/.flowise'
                                },
                                {
                                    name: 'SECRETKEY_PATH',
                                    value: '/root/.flowise'
                                },
                                {
                                    name: 'LOG_PATH',
                                    value: '/root/.flowise/logs'
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            command: ['/bin/sh', '-c'],
                            args: ['flowise start'],
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 3000
                                }
                            ],
                            mounts: [
                                {
                                    volume: `flowise-data`,
                                    volumePath: 'data',
                                    path: '/root/.flowise'
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.3,
                                memory: (resources.memory || 0.5) * 1024
                            }
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = FloiwseController;
//# sourceMappingURL=flowise.js.map
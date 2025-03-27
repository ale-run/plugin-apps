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
const logger = runtime_1.Logger.getLogger('app:bookstack');
const VERSIONS = {
    '24': '24.12',
    '23': '23.12'
};
class BookstackController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['24'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `bookstack-data`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            const route = {
                type: 'route',
                spec: {
                    name: 'bookstack',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'bookstack',
                    servicePort: 8080
                }
            };
            specs.push(route);
            const url = yield this.evaluateServiceURL(route.spec);
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-db-password`,
                    value: options.dbpassword
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-app-key`,
                    value: `base64:ZHA2eGd4eTV3dTQyeHgyNnU1cWozMHhsMDcyeXBzaWQ=`
                }
            });
            if (options.env && !Array.isArray(options.env))
                throw new Error('env must be an array');
            const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];
            options.dbhost &&
                options.dbport &&
                env.push({
                    name: 'DB_HOST',
                    value: `${options.dbhost}:${options.dbport}`
                });
            options.dbusername &&
                env.push({
                    name: 'DB_USERNAME',
                    value: `${options.dbusername}`
                });
            options.dbpassword &&
                env.push({
                    name: 'DB_PASSWORD',
                    secret: `${request.name}-db-password`
                });
            options.database &&
                env.push({
                    name: 'DB_DATABASE',
                    value: `${options.database}`
                });
            env.push({
                name: 'APP_KEY',
                secret: `${request.name}-app-key`
            });
            env.push({
                name: 'APP_URL',
                value: `${url}`
            });
            env.push({
                name: 'APP_LANG',
                value: `ko`
            });
            env.push({
                name: 'TZ',
                value: options.tz || 'Asia/Seoul'
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'bookstack',
                    hostname: request.name,
                    strategy: 'rolling',
                    containers: [
                        {
                            name: 'bookstack',
                            image: `solidnerd/bookstack:${version}`,
                            env,
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 8080
                                }
                            ],
                            mounts: [
                                {
                                    volume: `bookstack-data`,
                                    volumePath: 'public',
                                    path: '/var/www/bookstack/public/uploads'
                                },
                                {
                                    volume: `bookstack-data`,
                                    volumePath: 'storage',
                                    path: '/var/www/bookstack/storage/uploads'
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
            yield this.apply(specs);
        });
    }
}
exports.default = BookstackController;
//# sourceMappingURL=bookstack.js.map
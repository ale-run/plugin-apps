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
const logger = runtime_1.Logger.getLogger('app:rabbitmq');
const versions = {
    '4.0': '4.0.7',
    '3.13': '3.13.7',
    '3.12': '3.12.12',
    '3.11': '3.11.16',
    '3.10': '3.10.22'
};
class RabbitMQController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = versions[`${app.version}`] || versions['4.0'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `rabbitmq-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'rabbitmq',
                    type: runtime_1.ROUTE_TYPE.TCP,
                    service: 'rabbitmq',
                    servicePort: 5672
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
                type: 'route',
                spec: {
                    name: 'dashboard',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'rabbitmq',
                    servicePort: 15672
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'rabbitmq',
                    hostname: request.name,
                    containers: [
                        {
                            name: 'rabbitmq',
                            image: `rabbitmq:${version}-management`,
                            env: [
                                {
                                    name: 'RABBITMQ_DEFAULT_USER',
                                    value: options.username || 'user'
                                },
                                {
                                    name: 'RABBITMQ_DEFAULT_PASS',
                                    secret: `${request.name}-user-password`
                                }
                            ].filter((v) => v),
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 5672
                                },
                                {
                                    protocol: 'tcp',
                                    port: 15672
                                }
                            ],
                            mounts: [
                                {
                                    volume: `rabbitmq-volume`,
                                    volumePath: 'data',
                                    path: '/var/lib/rabbitmq'
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 1) * 1024
                            }
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = RabbitMQController;
//# sourceMappingURL=rabbitmq.js.map
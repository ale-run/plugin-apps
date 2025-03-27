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
const logger = runtime_1.Logger.getLogger('app:mongo');
class MongoController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const secretPrefix = request.name.split('.').join('_').split('-').join('_').toUpperCase();
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `mongo-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'mongo',
                    type: runtime_1.ROUTE_TYPE.TCP,
                    service: 'mongo',
                    servicePort: 27017
                }
            });
            options.mongoexpress &&
                specs.push({
                    type: 'route',
                    spec: {
                        name: 'mongo-express',
                        type: runtime_1.ROUTE_TYPE.HTTP,
                        service: 'mongo',
                        servicePort: 8081
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
                    name: 'mongo',
                    stateful: true,
                    hostname: request.name,
                    strategy: 'recreate',
                    containers: [
                        {
                            name: 'mongo',
                            image: `mongo:${app.version}`,
                            env: [
                                options.authentication && {
                                    name: 'MONGO_INITDB_ROOT_USERNAME',
                                    value: options.rootusername || 'root'
                                },
                                options.authentication && {
                                    name: 'MONGO_INITDB_ROOT_PASSWORD',
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
                                    port: 27017
                                }
                            ],
                            mounts: [
                                {
                                    volume: `mongo-volume`,
                                    volumePath: 'data',
                                    path: '/data/db'
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 0.5) * 1024
                            },
                            security: {
                                runAsUser: 999,
                                runAsGroup: 999
                            },
                            shell: options.authentication ? `mongo --username ${options.rootusername || 'root'} --password` : 'mongo'
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = MongoController;
//# sourceMappingURL=mongo.js.map
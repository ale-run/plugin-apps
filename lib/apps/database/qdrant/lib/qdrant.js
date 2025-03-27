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
const logger = runtime_1.Logger.getLogger('app:qdrant');
const VERSIONS = {
    '1.13': '1.13.0',
    '1.12': '1.12.5'
};
class QdrantController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['1.13'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `qdrant-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'qdrant',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'qdrant',
                    servicePort: 6333
                }
            });
            // specs.push({
            //   type: 'route',
            //   spec: {
            //     name: 'qdrant-grpc',
            //     type: 'grpc',
            //     service: 'qdrant-grpc',
            //     servicePort: 6334
            //   }
            // });
            // specs.push({
            //   type: 'secret',
            //   spec: {
            //     name: `${request.name}-apikey`,
            //     value: ''
            //   }
            // });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'qdrant',
                    stateful: true,
                    hostname: request.name,
                    strategy: 'rolling',
                    containers: [
                        {
                            name: 'qdrant',
                            image: `qdrant/qdrant:v${version}-unprivileged`,
                            env: [
                                // {
                                //   name: 'QDRANT__SERVICE__READ_ONLY_API_KEY',
                                //   secret: `${request.name}-apikey`
                                // },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 6333
                                }
                                // {
                                //   protocol: 'tcp',
                                //   port: 6334
                                // }
                            ],
                            mounts: [
                                {
                                    volume: `qdrant-volume`,
                                    volumePath: 'data',
                                    path: '/qdrant/storage'
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
exports.default = QdrantController;
//# sourceMappingURL=qdrant.js.map
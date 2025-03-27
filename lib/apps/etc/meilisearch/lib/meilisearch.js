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
const logger = runtime_1.Logger.getLogger('app:meilisearch');
const versions = {
    '1.13': '1.13.3'
};
class MeilisearchController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = versions[`${app.version}`] || versions['1.13'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `meilisearch-data`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'meilisearch',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'meilisearch',
                    servicePort: 7700
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-masterkey`,
                    value: ''
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'meilisearch',
                    hostname: request.name,
                    strategy: 'rolling',
                    replicas: resources.replicas || 1,
                    containers: [
                        {
                            name: 'meilisearch',
                            image: `getmeili/meilisearch:v${version}`,
                            env: [
                                {
                                    name: 'MEILI_ENV',
                                    value: `development`
                                },
                                {
                                    name: 'MEILI_MASTER_KEY',
                                    secret: `${request.name}-masterkey`
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 7700
                                }
                            ],
                            mounts: [
                                {
                                    volume: `meilisearch-data`,
                                    volumePath: 'data',
                                    path: '/meili_data'
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
exports.default = MeilisearchController;
//# sourceMappingURL=meilisearch.js.map
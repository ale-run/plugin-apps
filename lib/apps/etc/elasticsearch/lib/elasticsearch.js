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
const logger = runtime_1.Logger.getLogger('app:elasticsearch');
const VERSIONS = {
    '7': '7.10.1',
    '6': '6.8.23'
};
class ElasticsearchController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['7'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `elasticsearch-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'web',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'elasticsearch',
                    servicePort: 9200
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'manage',
                    type: runtime_1.ROUTE_TYPE.TCP,
                    service: 'elasticsearch',
                    servicePort: 9300
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'elasticsearch',
                    hostname: request.name,
                    containers: [
                        {
                            name: 'elasticsearch',
                            image: `elasticsearch:${version}`,
                            env: [{ name: 'discovery.type', value: 'single-node' }].concat(options.env || []),
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 9200
                                },
                                {
                                    protocol: 'tcp',
                                    port: 9300
                                }
                            ],
                            mounts: [
                                {
                                    volume: `elasticsearch-volume`,
                                    path: '/usr/share/elasticsearch/data'
                                },
                                options.config && {
                                    path: `/usr/share/elasticsearch/config/elasticsearch.yml`,
                                    contents: options.config
                                }
                            ].filter((v) => v),
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 2) * 1024
                            }
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = ElasticsearchController;
//# sourceMappingURL=elasticsearch.js.map
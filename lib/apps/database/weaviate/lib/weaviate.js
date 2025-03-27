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
const logger = runtime_1.Logger.getLogger('app:weaviate');
const VERSIONS = {
    '1.28': '1.28.4'
};
class WeaviateController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['1.28'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `weaviate-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-apikey`,
                    value: ''
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'weaviate',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'weaviate',
                    servicePort: 8080
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'weaviate-grpc',
                    type: 'grpc',
                    service: 'weaviate-grpc',
                    servicePort: 50051
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'weaviate',
                    stateful: true,
                    hostname: request.name,
                    strategy: 'rolling',
                    containers: [
                        {
                            name: 'weaviate',
                            image: `semitechnologies/weaviate:${version}`,
                            env: [
                                {
                                    name: 'QUERY_DEFAULTS_LIMIT',
                                    value: '25'
                                },
                                {
                                    name: 'AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED',
                                    value: 'true'
                                },
                                {
                                    name: 'PERSISTENCE_DATA_PATH',
                                    value: '/var/lib/weaviate'
                                },
                                {
                                    name: 'DEFAULT_VECTORIZER_MODULE',
                                    value: 'none'
                                },
                                {
                                    name: 'ENABLE_MODULES',
                                    value: 'text2vec-cohere,text2vec-huggingface,text2vec-palm,text2vec-openai,generative-openai,generative-cohere,generative-palm,ref2vec-centroid,reranker-cohere,qna-openai'
                                },
                                {
                                    name: 'CLUSTER_HOSTNAME',
                                    value: 'node1'
                                },
                                {
                                    name: 'AUTHENTICATION_APIKEY_ENABLED',
                                    value: 'true'
                                },
                                {
                                    name: 'AUTHENTICATION_APIKEY_ALLOWED_KEYS',
                                    secret: `${request.name}-apikey`
                                },
                                {
                                    name: 'AUTHENTICATION_APIKEY_USERS',
                                    value: options.adminemail || 'user@doe.com'
                                },
                                {
                                    name: 'AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED',
                                    value: 'false'
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 8080
                                },
                                {
                                    protocol: 'tcp',
                                    port: 50051
                                }
                            ],
                            mounts: [
                                {
                                    volume: `weaviate-volume`,
                                    volumePath: 'data',
                                    path: '/var/lib/weaviate'
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
exports.default = WeaviateController;
//# sourceMappingURL=weaviate.js.map
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
const logger = runtime_1.Logger.getLogger('app:chroma');
const VERSIONS = {
    '0.6': '0.6.3',
    '0.5': '0.5.23',
    '0.4': '0.4.22'
};
class ChromaController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['0.6'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `chroma-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'chroma',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'chroma',
                    servicePort: 8000
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-credential`,
                    value: ''
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'chroma',
                    stateful: true,
                    hostname: request.name,
                    strategy: 'rolling',
                    containers: [
                        {
                            name: 'chroma',
                            image: `chromadb/chroma:${version}`,
                            env: [
                                {
                                    name: 'IS_PERSISTENT',
                                    value: 'TRUE'
                                },
                                {
                                    name: 'CHROMA_SERVER_AUTH_CREDENTIALS',
                                    secret: `${request.name}-credential`
                                },
                                {
                                    name: 'CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER',
                                    value: 'chromadb.auth.token.TokenConfigServerAuthCredentialsProvider'
                                },
                                {
                                    name: 'CHROMA_SERVER_AUTH_PROVIDER',
                                    value: 'chromadb.auth.token.TokenAuthServerProvider'
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 8000
                                }
                            ],
                            mounts: [
                                {
                                    volume: `chroma-volume`,
                                    volumePath: 'data',
                                    path: '/chroma/chroma'
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
exports.default = ChromaController;
//# sourceMappingURL=chroma.js.map
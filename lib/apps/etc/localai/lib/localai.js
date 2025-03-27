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
const logger = runtime_1.Logger.getLogger('app:localai');
const VERSIONS = {
    '2.25': '2.25.0'
};
class LocalAIController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['2.25'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `localai-data`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'localai',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'localai',
                    servicePort: 8080
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'localai',
                    hostname: request.name,
                    strategy: 'rolling',
                    replicas: resources.replicas || 1,
                    containers: [
                        {
                            name: 'localai',
                            image: `localai/localai:v${version}-aio-cpu`,
                            env: [
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            // command: ['/bin/sh', '-c'],
                            // args: ['ollama run deepseek-r1'],
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 8080
                                }
                            ],
                            mounts: [
                                {
                                    volume: `localai-data`,
                                    volumePath: 'data',
                                    path: '/build/models'
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.3,
                                memory: (resources.memory || 0.5) * 1024
                            },
                            shell: '/bin/bash',
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = LocalAIController;
//# sourceMappingURL=localai.js.map
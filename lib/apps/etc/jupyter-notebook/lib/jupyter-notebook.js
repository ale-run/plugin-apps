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
const logger = runtime_1.Logger.getLogger('app:jupyter');
const VERSIONS = {
    '7': '7.0.3'
};
class JupyterController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['7'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `jupyter-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'jupyter-notebook',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'jupyter-notebook',
                    servicePort: 8888
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'jupyter-notebook',
                    hostname: request.name,
                    containers: [
                        {
                            name: 'jupyter-notebook',
                            image: `jupyter/minimal-notebook:notebook-${version}`,
                            env: [],
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 8888
                                }
                            ],
                            // lifecycle: {
                            //   start: {
                            //     command: ['/bin/sh', '-c', 'start-notebook.sh', `--IdentityProvider.token=''`]
                            //   }
                            // },
                            mounts: [
                                {
                                    volume: `jupyter-volume`,
                                    volumePath: 'data',
                                    path: '/home/jovyan/work'
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.5,
                                memory: (resources.memory || 1) * 1024
                            }
                            // command: ['/bin/bash', '-c'],
                            // args: [
                            //   'start-notebook.sh', `--IdentityProvider.token=''`
                            // ],
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = JupyterController;
//# sourceMappingURL=jupyter-notebook.js.map
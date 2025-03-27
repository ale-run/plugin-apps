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
const logger = runtime_1.Logger.getLogger('app:gitlab');
const VERSIONS = {
    '17': '17.11',
    '16': '16.11'
};
class GitLabController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['17'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `gitlab-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'gitlab',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'gitlab',
                    servicePort: 80
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'gitlab-ssh',
                    type: runtime_1.ROUTE_TYPE.TCP,
                    service: 'gitlab',
                    servicePort: 22
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
                    name: 'gitlab',
                    hostname: request.name,
                    containers: [
                        {
                            name: 'gitlab',
                            image: `gitlab/gitlab-ce:${version}-ce.0`,
                            env: [
                                {
                                    name: 'discovery.type',
                                    value: 'single-node'
                                },
                                {
                                    name: 'GITLAB_ROOT_PASSWORD',
                                    secret: `${request.name}-root-password`
                                },
                                {
                                    name: 'GITLAB_OMNIBUS_CONFIG',
                                    value: options.prometheus === true ? `prometheus_monitoring['enable'] = true` : `prometheus_monitoring['enable'] = false`
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ].concat(options.env || []),
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 80
                                },
                                {
                                    protocol: 'tcp',
                                    port: 22
                                }
                            ],
                            mounts: [
                                {
                                    volume: `gitlab-volume`,
                                    volumePath: 'data',
                                    path: '/var/opt/gitlab'
                                },
                                {
                                    volume: `gitlab-volume`,
                                    volumePath: 'logs',
                                    path: '/var/log/gitlab'
                                },
                                {
                                    volume: `gitlab-volume`,
                                    volumePath: 'config',
                                    path: '/etc/gitlab'
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 2,
                                memory: (resources.memory || 8) * 1024
                            }
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = GitLabController;
//# sourceMappingURL=gitlab.js.map
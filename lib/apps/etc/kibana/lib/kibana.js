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
const logger = runtime_1.Logger.getLogger('app:kibana');
const versions = {
    '7': '7.10.1',
    '6': '6.8.23'
};
class KibanaController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = versions[`${app.version}`] || versions['0.7'];
            if (options.env && !Array.isArray(options.env))
                throw new Error('env must be an array');
            const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];
            const specs = [];
            specs.push({
                type: 'route',
                spec: {
                    name: 'web',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'kibana',
                    servicePort: 5601
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-password`,
                    value: options.rootpassword
                }
            });
            const config = options.config || `server.host: 0.0.0.0`;
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'kibana',
                    hostname: request.name,
                    containers: [
                        {
                            name: 'kibana',
                            image: `kibana:${version}`,
                            env,
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 5601
                                }
                            ],
                            mounts: [
                                {
                                    path: `/usr/share/kibana/config/kibana.yml`,
                                    contents: config
                                }
                            ].filter((v) => v),
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
exports.default = KibanaController;
//# sourceMappingURL=kibana.js.map
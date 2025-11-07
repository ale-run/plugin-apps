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
const logger = runtime_1.Logger.getLogger('app:redis');
const versions = {
    '0.6.0rc1-r2': '0.6.0rc1-r2',
    'latest': 'latest'
};
class Crawl4AIController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = versions[`${app.version}`];
            if (!version)
                throw new Error(`unsupported redis version "${app.version}"`);
            if (options.env && !Array.isArray(options.env))
                throw new Error('env must be an array');
            const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];
            env.push({
                name: 'TZ',
                value: 'Asia/Seoul'
            });
            const specs = [];
            specs.push({
                type: 'route',
                spec: {
                    name: 'crawl4ai',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'crawl4ai',
                    servicePort: 11235
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'crawl4ai',
                    hostname: request.name,
                    containers: [
                        {
                            name: 'crawl4ai',
                            image: `unclecode/crawl4ai:${version}`,
                            env,
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 11235
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 0.5) * 1024
                            },
                            shell: '/bin/bash'
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = Crawl4AIController;
//# sourceMappingURL=crawl4ai.js.map
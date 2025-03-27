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
const logger = runtime_1.Logger.getLogger('app:kafka-ui');
const versions = {
    0.7: '0.7.1'
};
class KafkaUIController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = versions[`${app.version}`] || versions['0.7'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `kafka-ui-data`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'kafka-ui',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'kafka-ui',
                    servicePort: 8080
                }
            });
            if (options.env && !Array.isArray(options.env))
                throw new Error('env must be an array');
            const env = (options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v)) || [];
            env.push({
                name: 'TZ',
                value: 'Asia/Seoul'
            });
            env.push({
                name: 'DYNAMIC_CONFIG_ENABLED',
                value: 'true'
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'kafka-ui',
                    hostname: request.name,
                    strategy: 'rolling',
                    replicas: resources.replicas || 1,
                    containers: [
                        {
                            name: 'kafka-ui',
                            image: `provectuslabs/kafka-ui:v${version}`,
                            env,
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 8080
                                }
                            ],
                            mounts: [
                                options.config && {
                                    path: `/etc/kafkaui/dynamic_config.yaml`,
                                    contents: options.config
                                }
                            ].filter((v) => v),
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 0.5) * 1024
                            },
                            shell: '/bin/sh'
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = KafkaUIController;
//# sourceMappingURL=kafka-ui.js.map
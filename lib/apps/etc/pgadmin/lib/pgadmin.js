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
const logger = runtime_1.Logger.getLogger('app:pgadmin');
const versions = {
    '9': '9.1'
};
class PgAdminController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = versions[`${app.version}`] || versions['9'];
            const specs = [];
            specs.push({
                type: 'route',
                spec: {
                    name: 'pgadmin',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'pgadmin',
                    servicePort: 5050
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-admin-password`,
                    value: options.adminpassword
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'pgadmin',
                    hostname: request.name,
                    containers: [
                        {
                            name: 'pgadmin',
                            image: `dpage/pgadmin4:${version}`,
                            env: [
                                {
                                    name: 'PGADMIN_DEFAULT_EMAIL',
                                    value: options.adminemail
                                },
                                {
                                    name: 'PGADMIN_DEFAULT_PASSWORD',
                                    secret: `${request.name}-admin-password`
                                },
                                {
                                    name: 'PGADMIN_LISTEN_PORT',
                                    value: '5050'
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 5050
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 0.5) * 1024
                            }
                        }
                    ].filter((v) => v)
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = PgAdminController;
//# sourceMappingURL=pgadmin.js.map
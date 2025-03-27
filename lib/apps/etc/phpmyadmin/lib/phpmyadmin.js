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
const logger = runtime_1.Logger.getLogger('app:phpmyadmin');
class PhpMyAdminController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const options = request.options || {};
            const resources = request.resources || {};
            const specs = [];
            specs.push({
                type: 'route',
                spec: {
                    name: 'phpmyadmin',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'phpmyadmin',
                    servicePort: 80
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
                type: 'secret',
                spec: {
                    name: `${request.name}-user-password`,
                    value: options.userpassword
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'phpmyadmin',
                    hostname: request.name,
                    containers: [
                        {
                            name: 'phpmyadmin',
                            image: `phpmyadmin:5.2`,
                            env: [
                                {
                                    name: 'MYSQL_ROOT_PASSWORD',
                                    secret: `${request.name}-root-password`
                                },
                                {
                                    name: 'MYSQL_USER',
                                    value: options.username
                                },
                                {
                                    name: 'MYSQL_PASSWORD',
                                    secret: `${request.name}-user-password`
                                },
                                {
                                    name: 'PMA_HOST',
                                    value: options.dbhost
                                },
                                {
                                    name: 'PMA_PORT',
                                    value: options.dbport || `3306`
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 80
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
exports.default = PhpMyAdminController;
//# sourceMappingURL=phpmyadmin.js.map
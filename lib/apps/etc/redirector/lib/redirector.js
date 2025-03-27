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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runtime_1 = require("@ale-run/runtime");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const es6_template_string_1 = __importDefault(require("es6-template-string"));
const logger = runtime_1.Logger.getLogger('app:redirector');
class RedirectorController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.getRequest();
            const options = request.options || {};
            if (!options.redirect)
                throw new Error(`options.redirect is required`);
            const nginxtext = fs_1.default.readFileSync(path_1.default.join(__dirname, 'nginx.conf'), 'utf8');
            const nginxconf = (0, es6_template_string_1.default)(nginxtext, { redirect: options.redirect });
            const specs = [];
            specs.push({
                type: 'route',
                spec: {
                    name: 'redirector',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'redirector',
                    servicePort: 80
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'redirector',
                    hostname: request.name,
                    replicas: 1,
                    strategy: 'rolling',
                    containers: [
                        {
                            name: 'redirector',
                            image: `nginx:1.24-alpine`,
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 80
                                }
                            ],
                            mounts: [
                                {
                                    path: `/etc/nginx/nginx.conf`,
                                    contents: nginxconf
                                }
                            ],
                            resources: {
                                requests: {
                                    cpu: 0.02,
                                    memory: 8
                                },
                                limits: {
                                    cpu: 0.02,
                                    memory: 16
                                }
                            }
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = RedirectorController;
//# sourceMappingURL=redirector.js.map
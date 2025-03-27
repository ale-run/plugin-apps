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
const logger = runtime_1.Logger.getLogger('app:jekyll');
class JekyllController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.getRequest();
            const options = request.options || {};
            const resources = request.resources || {};
            const git = Object.assign({}, (request.context && request.context.git) || {}, (request.options && request.options.git) || {});
            if (!git || !git.url)
                throw new Error(`options.git is required`);
            let docbase = (options.docbase || '_site').split('\n').join('').split('\r').join('');
            while (docbase.startsWith('./'))
                docbase = docbase.substring(2);
            while (docbase.startsWith('/'))
                docbase = docbase.substring(1);
            const nginxtext = fs_1.default.readFileSync(path_1.default.join(__dirname, 'nginx.conf'), 'utf8');
            const nginxconf = (0, es6_template_string_1.default)(nginxtext, { options });
            const buildenv = options.buildenv &&
                options.buildenv
                    .filter((env) => env && env.name)
                    .map((item) => item.name && `ENV ${item.name}="${item.value || ''}"`)
                    .join('\n');
            const dockerfiletext = fs_1.default.readFileSync(path_1.default.join(__dirname, 'dockerfile'), 'utf8');
            const dockerfile = (0, es6_template_string_1.default)(dockerfiletext, {
                app,
                npmrc: options.npmrc,
                nodeversion: options.nodeversion && options.nodeversion.split('\n').join(' '),
                npminstall: options.npminstall && options.npminstall.split('\n').join(' '),
                npmbuild: options.npmbuild && options.npmbuild.split('\n').join(' '),
                build: options.build && options.build.split('\n').join(' '),
                git,
                buildenv,
                nginxconf,
                docbase
            });
            const result = yield this.build({
                repository: git,
                dockerfile: {
                    text: dockerfile
                }
            });
            const targetImage = result.image.name;
            if (!targetImage)
                throw new Error(`build image was null`);
            if (options.env && !Array.isArray(options.env))
                throw new Error('env must be an array');
            const env = options.env && options.env.map((e) => e.name && { name: e.name, value: e.value, var: e.var, secret: e.secret }).filter((v) => v);
            const specs = [];
            specs.push({
                type: 'route',
                spec: {
                    name: 'jekyll',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'jekyll',
                    servicePort: 80
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'jekyll',
                    hostname: request.name,
                    replicas: resources.replicas || 1,
                    sessionAffinity: true,
                    strategy: options.strategy || 'rolling',
                    containers: [
                        {
                            name: 'jekyll',
                            image: targetImage,
                            env,
                            expose: [
                                {
                                    protocol: 'http',
                                    port: 80
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 0.1) * 1024
                            },
                            healthz: options.healthz
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = JekyllController;
//# sourceMappingURL=jekyll.js.map
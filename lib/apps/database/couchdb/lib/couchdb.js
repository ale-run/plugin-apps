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
const logger = runtime_1.Logger.getLogger('app:coudchdb');
const VERSIONS = {
    '3': '3.4.2',
    '2': '2.3.1'
};
class CouchDBController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['3'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `couchdb-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'couchdb',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'couchdb',
                    servicePort: 5984
                }
            });
            specs.push({
                type: 'secret',
                spec: {
                    name: `${request.name}-user-password`,
                    value: options.password
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'couchdb',
                    stateful: true,
                    hostname: request.name,
                    strategy: 'recreate',
                    containers: [
                        {
                            name: 'couchdb',
                            image: `couchdb:${app.version}`,
                            env: [
                                {
                                    name: 'COUCHDB_USER',
                                    value: options.username
                                },
                                {
                                    name: 'COUCHDB_PASSWORD',
                                    secret: `${request.name}-user-password`
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ],
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 5984
                                }
                            ],
                            mounts: [
                                {
                                    volume: `couchdb-volume`,
                                    volumePath: 'data',
                                    path: '/opt/couchdb/data'
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 0.5) * 1024
                            },
                            security: {
                                allowPrivilegeEscalation: false,
                                privileged: false,
                                runAsNonRoot: true,
                                runAsUser: 1000,
                                runAsGroup: 1000
                            }
                            // shell: `curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_users && curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_replicator && curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_global_changes`,
                            // lifecycle: {
                            //   postStart: {
                            //     exec: {
                            //       command: [`curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_users && curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_replicator && curl -X PUT http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_global_changes`]
                            //     }
                            //   }
                            // },
                        }
                    ]
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = CouchDBController;
//# sourceMappingURL=couchdb.js.map
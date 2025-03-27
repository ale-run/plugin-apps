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
const logger = runtime_1.Logger.getLogger('app:influxdb');
const VERSIONS = {
    '2.7': '2.7.5'
};
class InfluxDBController extends runtime_1.ClusterAppController {
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('deploy started', this.deployment.getAccessName());
            const app = this.app;
            const request = this.request;
            const ctx = this;
            const options = request.options || {};
            const resources = request.resources || {};
            const version = VERSIONS[`${app.version}`] || VERSIONS['2.7'];
            const specs = [];
            specs.push({
                type: 'volume',
                spec: {
                    name: `influxdb-volume`,
                    size: `${resources.disk || 1}Gi`,
                    mode: 'rwx'
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
                type: 'secret',
                spec: {
                    name: `${request.name}-admin-token`
                }
            });
            specs.push({
                type: 'route',
                spec: {
                    name: 'dashboard',
                    type: runtime_1.ROUTE_TYPE.HTTP,
                    service: 'influxdb',
                    servicePort: 8086
                }
            });
            specs.push({
                type: 'service:container',
                spec: {
                    name: 'influxdb',
                    stateful: true,
                    hostname: request.name,
                    strategy: 'recreate',
                    containers: [
                        {
                            name: 'influxdb',
                            image: `influxdb:${version}`,
                            env: [
                                {
                                    name: 'DOCKER_INFLUXDB_INIT_MODE',
                                    value: 'setup'
                                },
                                {
                                    name: 'DOCKER_INFLUXDB_INIT_USERNAME',
                                    value: options.adminusername || 'admin'
                                },
                                {
                                    name: 'DOCKER_INFLUXDB_INIT_PASSWORD',
                                    secret: `${request.name}-admin-password`
                                },
                                {
                                    name: 'DOCKER_INFLUXDB_INIT_ORG',
                                    value: options.initialorg || 'my-org'
                                },
                                {
                                    name: 'DOCKER_INFLUXDB_INIT_BUCKET',
                                    value: options.initialbucket || 'my-bucket'
                                },
                                {
                                    name: 'DOCKER_INFLUXDB_INIT_BUCKET',
                                    value: options.initialbucket || 'my-bucket'
                                },
                                {
                                    name: 'DOCKER_INFLUXDB_INIT_RETENTION',
                                    value: options.retention || '12w'
                                },
                                {
                                    name: 'DOCKER_INFLUXDB_INIT_ADMIN_TOKEN',
                                    secret: `${request.name}-admin-token`
                                },
                                {
                                    name: 'TZ',
                                    value: options.tz || 'Asia/Seoul'
                                }
                            ].filter((v) => v),
                            expose: [
                                {
                                    protocol: 'tcp',
                                    port: 8086
                                }
                            ],
                            mounts: [
                                {
                                    volume: `influxdb-volume`,
                                    volumePath: 'data',
                                    path: '/var/lib/influxdb2'
                                }
                            ],
                            limits: {
                                cpu: resources.cpu || 0.2,
                                memory: (resources.memory || 0.5) * 1024
                            },
                            shell: `influx v1 shell --host http://localhost:8086 --org $DOCKER_INFLUXDB_INIT_ORG --token $DOCKER_INFLUXDB_INIT_ADMIN_TOKEN`
                            // shell: options.authentication ? `influx config --username ${options.superuserusername || 'superuser'} --password` : 'influx'
                        }
                    ].filter((v) => v)
                }
            });
            yield this.apply(specs);
        });
    }
}
exports.default = InfluxDBController;
//# sourceMappingURL=influxdb.js.map
import { ClusterAppController } from '@ale-run/runtime';
export default class InfluxDBController extends ClusterAppController {
    deploy(): Promise<void>;
}

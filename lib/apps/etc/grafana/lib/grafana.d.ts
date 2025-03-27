import { ClusterAppController } from '@ale-run/runtime';
export default class GrafanaController extends ClusterAppController {
    deploy(): Promise<void>;
}

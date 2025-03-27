import { ClusterAppController } from '@ale-run/runtime';
export default class KibanaController extends ClusterAppController {
    deploy(): Promise<void>;
}

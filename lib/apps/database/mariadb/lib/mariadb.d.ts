import { ClusterAppController } from '@ale-run/runtime';
export default class MariaDBController extends ClusterAppController {
    deploy(): Promise<void>;
}

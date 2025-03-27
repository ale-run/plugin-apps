import { ClusterAppController } from '@ale-run/runtime';
export default class GhostController extends ClusterAppController {
    deploy(): Promise<void>;
}

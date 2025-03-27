import { ClusterAppController } from '@ale-run/runtime';
export default class QdrantController extends ClusterAppController {
    deploy(): Promise<void>;
}

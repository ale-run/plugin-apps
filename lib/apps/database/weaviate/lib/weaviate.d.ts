import { ClusterAppController } from '@ale-run/runtime';
export default class WeaviateController extends ClusterAppController {
    deploy(): Promise<void>;
}

import { ClusterAppController } from '@ale-run/runtime';
export default class CouchDBController extends ClusterAppController {
    deploy(): Promise<void>;
}

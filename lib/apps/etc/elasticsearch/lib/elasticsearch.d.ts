import { ClusterAppController } from '@ale-run/runtime';
export default class ElasticsearchController extends ClusterAppController {
    deploy(): Promise<void>;
}

import { ClusterAppController } from '@ale-run/runtime';
export default class MeilisearchController extends ClusterAppController {
    deploy(): Promise<void>;
}

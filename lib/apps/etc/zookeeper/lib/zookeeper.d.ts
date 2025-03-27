import { ClusterAppController } from '@ale-run/runtime';
export default class ZookeeperController extends ClusterAppController {
    deploy(): Promise<void>;
}

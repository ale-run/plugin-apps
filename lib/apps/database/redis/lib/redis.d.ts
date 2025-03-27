import { ClusterAppController } from '@ale-run/runtime';
export default class RedisController extends ClusterAppController {
    deploy(): Promise<void>;
}

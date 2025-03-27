import { ClusterAppController } from '@ale-run/runtime';
export default class RedirectorController extends ClusterAppController {
    deploy(): Promise<void>;
}

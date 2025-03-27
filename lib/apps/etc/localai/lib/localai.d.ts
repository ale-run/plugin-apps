import { ClusterAppController } from '@ale-run/runtime';
export default class LocalAIController extends ClusterAppController {
    deploy(): Promise<void>;
}

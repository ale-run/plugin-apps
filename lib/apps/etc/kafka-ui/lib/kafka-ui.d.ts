import { ClusterAppController } from '@ale-run/runtime';
export default class KafkaUIController extends ClusterAppController {
    deploy(): Promise<void>;
}

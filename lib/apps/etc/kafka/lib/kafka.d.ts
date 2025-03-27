import { ClusterAppController } from '@ale-run/runtime';
export default class KafkaController extends ClusterAppController {
    deploy(): Promise<void>;
}

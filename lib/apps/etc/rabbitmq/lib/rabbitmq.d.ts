import { ClusterAppController } from '@ale-run/runtime';
export default class RabbitMQController extends ClusterAppController {
    deploy(): Promise<void>;
}

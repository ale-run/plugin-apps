import { ClusterAppController } from '@ale-run/runtime';
export default class MongoController extends ClusterAppController {
    deploy(): Promise<void>;
}

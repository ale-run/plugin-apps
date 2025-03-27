import { ClusterAppController } from '@ale-run/runtime';
export default class MongoExpressController extends ClusterAppController {
    deploy(): Promise<void>;
}

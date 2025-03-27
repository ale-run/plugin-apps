import { ClusterAppController } from '@ale-run/runtime';
export default class PgvectorController extends ClusterAppController {
    deploy(): Promise<void>;
}

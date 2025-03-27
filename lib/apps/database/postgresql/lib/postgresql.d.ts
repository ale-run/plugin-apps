import { ClusterAppController } from '@ale-run/runtime';
export default class PsqlController extends ClusterAppController {
    deploy(): Promise<void>;
}

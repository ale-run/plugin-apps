import { ClusterAppController } from '@ale-run/runtime';
export default class JekyllController extends ClusterAppController {
    deploy(): Promise<void>;
}

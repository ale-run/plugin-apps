import { ClusterAppController } from '@ale-run/runtime';
export default class GiteaController extends ClusterAppController {
    deploy(): Promise<void>;
}

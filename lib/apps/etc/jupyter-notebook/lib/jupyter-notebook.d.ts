import { ClusterAppController } from '@ale-run/runtime';
export default class JupyterController extends ClusterAppController {
    deploy(): Promise<void>;
}

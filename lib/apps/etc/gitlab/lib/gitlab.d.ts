import { ClusterAppController } from '@ale-run/runtime';
export default class GitLabController extends ClusterAppController {
    deploy(): Promise<void>;
}

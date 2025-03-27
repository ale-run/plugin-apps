import { ClusterAppController } from '@ale-run/runtime';
export default class Neo4jController extends ClusterAppController {
    deploy(): Promise<void>;
}

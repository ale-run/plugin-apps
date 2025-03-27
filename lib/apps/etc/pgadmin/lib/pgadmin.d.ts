import { ClusterAppController } from '@ale-run/runtime';
export default class PgAdminController extends ClusterAppController {
    deploy(): Promise<void>;
}

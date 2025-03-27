import { Plugin } from '@ale-run/runtime';
export default class AleApps extends Plugin {
    install(): Promise<void>;
    uninstall(): Promise<void>;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
}

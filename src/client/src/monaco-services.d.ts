import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { MonacoCommands } from './monaco-commands';
import { MonacoLanguages } from "./monaco-languages";
import { MonacoWorkspace } from "./monaco-workspace";
import { ConsoleWindow } from "./console-window";
import { Services } from "./services";
import { Disposable } from './disposable';
export interface MonacoServices extends Services {
    commands: MonacoCommands;
    languages: MonacoLanguages;
    workspace: MonacoWorkspace;
    window: ConsoleWindow;
}
export declare namespace MonacoServices {
    interface Options {
        rootUri?: string;
    }
    type Provider = () => MonacoServices;
    function create(_monaco: typeof monaco, options?: Options): MonacoServices;
    function install(_monaco: typeof monaco, options?: Options): Disposable;
    function get(): MonacoServices;
}
//# sourceMappingURL=monaco-services.d.ts.map
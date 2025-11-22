import type { Pane, FolderApi } from 'tweakpane';
import tweakpaneConfig from './tweakpane-config.json';
interface BindingConfig {
    key: string;
    label: string;
    type?: 'boolean' | 'color' | 'list';
    min?: number;
    max?: number;
    step?: number;
    options?: Array<{
        text: string;
        value: string | number;
    }>;
}
interface FolderConfig {
    title: string;
    expanded?: boolean;
    bindings?: BindingConfig[];
    children?: Record<string, FolderConfig>;
}
interface TweakpaneConfig {
    folders: Record<string, FolderConfig>;
}
type ChangeHandler = (key: string, value: unknown) => void;
export declare function buildTweakpaneFromConfig(pane: Pane | FolderApi, params: Record<string, unknown>, onChange: ChangeHandler, config?: TweakpaneConfig): Map<string, unknown>;
export declare function getNestedValue(params: Record<string, unknown>, key: string): unknown;
export declare function setNestedValue(params: Record<string, unknown>, key: string, value: unknown): void;
export { tweakpaneConfig };
export type { TweakpaneConfig, FolderConfig, BindingConfig };

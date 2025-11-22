import type { Pane, FolderApi } from 'tweakpane';
import tweakpaneConfig from './tweakpane-config.json';

interface BindingConfig {
  key: string;
  label: string;
  type?: 'boolean' | 'color' | 'list';
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ text: string; value: string | number }>;
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

export function buildTweakpaneFromConfig(
  pane: Pane | FolderApi,
  params: Record<string, unknown>,
  onChange: ChangeHandler,
  config: TweakpaneConfig = tweakpaneConfig as TweakpaneConfig
): Map<string, unknown> {
  const bindings = new Map<string, unknown>();

  const processFolder = (
    parent: Pane | FolderApi,
    folderConfig: FolderConfig,
    folderKey: string
  ): FolderApi => {
    const folder = parent.addFolder({
      title: folderConfig.title,
      expanded: folderConfig.expanded ?? false,
    });

    if (folderConfig.bindings) {
      for (const bindingConfig of folderConfig.bindings) {
        const binding = createBinding(folder, params, bindingConfig, onChange);
        if (binding) {
          bindings.set(bindingConfig.key, binding);
        }
      }
    }

    if (folderConfig.children) {
      for (const [childKey, childConfig] of Object.entries(folderConfig.children)) {
        processFolder(folder, childConfig, childKey);
      }
    }

    return folder;
  };

  for (const [key, folderConfig] of Object.entries(config.folders)) {
    processFolder(pane, folderConfig, key);
  }

  return bindings;
}

function createBinding(
  parent: FolderApi,
  params: Record<string, unknown>,
  config: BindingConfig,
  onChange: ChangeHandler
): unknown {
  const key = config.key;

  // Handle nested keys like "edgeMask.smoothing.enabled"
  const keyParts = key.split('.');
  let target = params;
  let finalKey = key;

  if (keyParts.length > 1) {
    for (let i = 0; i < keyParts.length - 1; i++) {
      const part = keyParts[i];
      if (target[part] === undefined) {
        target[part] = {};
      }
      target = target[part] as Record<string, unknown>;
    }
    finalKey = keyParts[keyParts.length - 1];
  }

  // Skip if the value doesn't exist and we can't determine a default
  if (target[finalKey] === undefined) {
    if (config.type === 'boolean') {
      target[finalKey] = false;
    } else if (config.type === 'color') {
      target[finalKey] = '#ffffff';
    } else if (config.type === 'list' && config.options?.length) {
      target[finalKey] = config.options[0].value;
    } else if (config.min !== undefined) {
      target[finalKey] = config.min;
    } else {
      return null;
    }
  }

  const bindingOptions: Record<string, unknown> = {
    label: config.label,
  };

  if (config.type === 'list' && config.options) {
    const options: Record<string, string | number> = {};
    for (const opt of config.options) {
      options[opt.text] = opt.value;
    }
    bindingOptions.options = options;
  } else if (config.type !== 'boolean' && config.type !== 'color') {
    if (config.min !== undefined) bindingOptions.min = config.min;
    if (config.max !== undefined) bindingOptions.max = config.max;
    if (config.step !== undefined) bindingOptions.step = config.step;
  }

  const binding = parent.addBinding(target, finalKey, bindingOptions);

  binding.on('change', (ev: { value: unknown }) => {
    onChange(key, ev.value);
  });

  return binding;
}

// Helper to get a nested value from params
export function getNestedValue(params: Record<string, unknown>, key: string): unknown {
  const parts = key.split('.');
  let value: unknown = params;
  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return value;
}

// Helper to set a nested value in params
export function setNestedValue(params: Record<string, unknown>, key: string, value: unknown): void {
  const parts = key.split('.');
  let target = params;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (target[part] === undefined) {
      target[part] = {};
    }
    target = target[part] as Record<string, unknown>;
  }
  target[parts[parts.length - 1]] = value;
}

// Export the config for external use
export { tweakpaneConfig };
export type { TweakpaneConfig, FolderConfig, BindingConfig };

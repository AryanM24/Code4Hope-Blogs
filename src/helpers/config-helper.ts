/*
 * @file: Configuration handler
 */
import type { SlateConfig } from '@/typings/config';

/** Default configuration */
const defaultConfig: Partial<SlateConfig> = {
  lang: 'zh-CN',
  readTime: false,
  lastModified: false,
};

export function defineConfig(config: SlateConfig): SlateConfig {
  return Object.assign({}, defaultConfig, config);
}

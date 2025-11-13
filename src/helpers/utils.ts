import slateConfig from '~@/slate.config';

/**
 * @description: Get full title
 * @param title
 */
export function getFullTitle(title: string) {
  return `${title}${!!title && slateConfig.title ? ' | ' : ''}${slateConfig.title}`;
}


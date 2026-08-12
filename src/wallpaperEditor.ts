import type {
  ResolvedWallpaperTemplate,
  WallpaperImageMetrics,
} from '@claralight-design/wallpaper-engine';
import { getDevicePreset } from './devices';
import { defaultTemplate, layoutTemplates } from './layouts';

export type ImageMetrics = WallpaperImageMetrics;

export type SelectOption = {
  value: string;
  label: string;
};

export const blendModeOptions = [
  { value: 'normal', label: '正常' },
  { value: 'multiply', label: '正片叠底' },
  { value: 'screen', label: '滤色' },
  { value: 'overlay', label: '叠加' },
  { value: 'darken', label: '变暗' },
  { value: 'lighten', label: '变亮' },
  { value: 'color-dodge', label: '颜色减淡' },
  { value: 'color-burn', label: '颜色加深' },
  { value: 'hard-light', label: '强光' },
  { value: 'soft-light', label: '柔光' },
  { value: 'difference', label: '差值' },
  { value: 'exclusion', label: '排除' },
  { value: 'hue', label: '色相' },
  { value: 'saturation', label: '饱和度' },
  { value: 'color', label: '颜色' },
  { value: 'luminosity', label: '明度' },
] as const;

export const CONTENT_CARD_PADDING = { base: 5, md: 6 } as const;
export const FLOATING_BAR_BLUR_HEIGHT = 108;
export const GITHUB_REPO_URL = 'https://github.com/aurysian-yan/aurysian-tools';

export const surfaceCardProps = {
  bg: 'bg.panel',
  borderWidth: '0',
  borderColor: 'transparent',
  boxShadow: 'none',
} as const;

export function getInitialTemplateId() {
  if (typeof window === 'undefined') {
    return defaultTemplate.id;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const deviceKey = searchParams.get('device');
  const templateId = searchParams.get('template');
  const matchedTemplate = layoutTemplates.find(
    (item) => item.deviceKey === deviceKey || item.id === templateId,
  );

  return matchedTemplate?.id ?? defaultTemplate.id;
}

export function getDeviceOptions() {
  return layoutTemplates.map((item) => ({
    value: item.deviceKey,
    label: getDevicePreset(item.deviceKey)?.name ?? item.deviceKey,
  }));
}

export function getTemplateLabel(template: ResolvedWallpaperTemplate) {
  const device = getDevicePreset(template.deviceKey);
  return `${template.watchface.name} - ${device?.name ?? template.deviceKey}`;
}

export function getExportFileName(templateId: string, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${templateId}-${year}${month}${day}-${hours}${minutes}${seconds}.png`;
}

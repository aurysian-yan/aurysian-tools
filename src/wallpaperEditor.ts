import { getDevicePreset } from './devices';
import { defaultTemplate, layoutTemplates, type LayoutTemplate } from './layouts';

type PreviewModule = string | { default: string };
type PreviewRequireContext = {
  (id: string): PreviewModule;
  keys: () => string[];
};

declare const require: {
  context: (directory: string, useSubdirectories: boolean, regExp: RegExp) => PreviewRequireContext;
};

const previewOverlayContext = require.context('./preview', false, /\.png$/);

export type ImageMetrics = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export type TransformState = {
  scale: number;
  position: Position;
};

export type SelectOption = {
  value: string;
  label: string;
};

export const PREVIEW_CANVAS_MAX_WIDTH = 360;
export const STABLE_VIEWPORT_HEIGHT = '100svh';
export const PREVIEW_CANVAS_MAX_VIEWPORT_HEIGHT = '75svh';
export const DIALOG_VIEWPORT_MARGIN = '24px';
export const FLOATING_BAR_BLUR_HEIGHT = 108;
export const CONTENT_CARD_PADDING = { base: 5, md: 6 } as const;
export const GITHUB_REPO_URL = 'https://github.com/aurysian-yan/aurysian-tools';

export const checkerboardLight = `
  linear-gradient(45deg, rgba(223, 228, 232, 0.88) 25%, transparent 25%),
  linear-gradient(-45deg, rgba(223, 228, 232, 0.88) 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, rgba(223, 228, 232, 0.88) 75%),
  linear-gradient(-45deg, transparent 75%, rgba(223, 228, 232, 0.88) 75%)
`;

export const checkerboardDark = `
  linear-gradient(45deg, rgba(70, 77, 89, 0.72) 25%, transparent 25%),
  linear-gradient(-45deg, rgba(70, 77, 89, 0.72) 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, rgba(70, 77, 89, 0.72) 75%),
  linear-gradient(-45deg, transparent 75%, rgba(70, 77, 89, 0.72) 75%)
`;

export const surfaceCardProps = {
  bg: 'bg.panel',
  borderWidth: '0',
  borderColor: 'transparent',
  boxShadow: 'none',
} as const;

export const previewOverlayAssets = previewOverlayContext.keys().reduce<Record<string, string>>(
  (assets, assetPath) => {
    const assetModule = previewOverlayContext(assetPath);
    assets[`./preview/${assetPath.replace('./', '')}`] =
      typeof assetModule === 'string' ? assetModule : assetModule.default;
    return assets;
  },
  {},
);

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getMinScale(image: ImageMetrics, frame: LayoutTemplate['frame']) {
  return Math.max(frame.width / image.width, frame.height / image.height);
}

export function getBoundedPosition(
  image: ImageMetrics,
  frame: LayoutTemplate['frame'],
  scale: number,
  position: Position,
) {
  const renderedWidth = image.width * scale;
  const renderedHeight = image.height * scale;
  const limitX = Math.max(0, (renderedWidth - frame.width) / 2);
  const limitY = Math.max(0, (renderedHeight - frame.height) / 2);

  return {
    x: clamp(position.x, -limitX, limitX),
    y: clamp(position.y, -limitY, limitY),
  };
}

export function getPositionWithAnchor(
  startPosition: Position,
  startScale: number,
  nextScale: number,
  frame: LayoutTemplate['frame'],
  startAnchor: Position,
  nextAnchor: Position = startAnchor,
) {
  if (startScale === 0) {
    return startPosition;
  }

  const scaleRatio = nextScale / startScale;
  const startAnchorOffset = {
    x: startAnchor.x - frame.width / 2,
    y: startAnchor.y - frame.height / 2,
  };
  const nextAnchorOffset = {
    x: nextAnchor.x - frame.width / 2,
    y: nextAnchor.y - frame.height / 2,
  };

  return {
    x: nextAnchorOffset.x - (startAnchorOffset.x - startPosition.x) * scaleRatio,
    y: nextAnchorOffset.y - (startAnchorOffset.y - startPosition.y) * scaleRatio,
  };
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = src;
  });
}

export function createRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const limitedRadius = clamp(radius, 0, Math.min(width, height) / 2);

  context.beginPath();

  if (limitedRadius === 0) {
    context.rect(x, y, width, height);
    return;
  }

  context.moveTo(x + limitedRadius, y);
  context.arcTo(x + width, y, x + width, y + height, limitedRadius);
  context.arcTo(x + width, y + height, x, y + height, limitedRadius);
  context.arcTo(x, y + height, x, y, limitedRadius);
  context.arcTo(x, y, x + width, y, limitedRadius);
  context.closePath();
}

export function getTemplateLabel(template: LayoutTemplate) {
  const device = getDevicePreset(template.deviceKey);
  return `${template.watchface.name} - ${device?.name ?? template.deviceKey}`;
}

export function getTemplatePreviewAssetPath(template: LayoutTemplate) {
  const device = getDevicePreset(template.deviceKey);
  return `./preview/${template.watchface.previewKey}.${device?.key ?? template.deviceKey}.png`;
}

export function getInitialTemplateId() {
  if (typeof window === 'undefined') {
    return defaultTemplate.id;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const watchfaceKey = searchParams.get('watchface');
  const deviceKey = searchParams.get('device');
  const templateId = searchParams.get('template');

  if (watchfaceKey && deviceKey) {
    const exactMatch = layoutTemplates.find(
      (item) =>
        item.watchface.previewKey === watchfaceKey && item.deviceKey === deviceKey,
    );

    if (exactMatch) {
      return exactMatch.id;
    }
  }

  if (watchfaceKey) {
    const watchfaceMatch = layoutTemplates.find(
      (item) => item.watchface.previewKey === watchfaceKey,
    );

    if (watchfaceMatch) {
      return watchfaceMatch.id;
    }
  }

  if (deviceKey) {
    const deviceMatch = layoutTemplates.find((item) => item.deviceKey === deviceKey);

    if (deviceMatch) {
      return deviceMatch.id;
    }
  }

  if (templateId) {
    const templateMatch = layoutTemplates.find((item) => item.id === templateId);

    if (templateMatch) {
      return templateMatch.id;
    }
  }

  return defaultTemplate.id;
}

export function getWatchfaceOptions() {
  const options = new Map<string, string>();

  layoutTemplates.forEach((item) => {
    options.set(item.watchface.previewKey, item.watchface.name);
  });

  return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
}

export function getDeviceOptions(watchfaceKey: string) {
  const options = new Map<string, string>();

  layoutTemplates
    .filter((item) => item.watchface.previewKey === watchfaceKey)
    .forEach((item) => {
      const itemDevice = getDevicePreset(item.deviceKey);
      options.set(item.deviceKey, itemDevice?.name ?? item.deviceKey);
    });

  return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
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

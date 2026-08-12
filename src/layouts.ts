import { normalizeWallpaperConfig } from '@claralight-design/wallpaper-engine';

const bandProGlass = new URL(
  './assets/watchfaces/jiangge/10p9p-glass.png',
  import.meta.url,
).href;
const bandProBorder = new URL(
  './assets/watchfaces/jiangge/10p9p-border.png',
  import.meta.url,
).href;
const redmiWatchGlass = new URL(
  './assets/watchfaces/jiangge/rw-glass.png',
  import.meta.url,
).href;
const redmiWatchBorder = new URL(
  './assets/watchfaces/jiangge/rw-border.png',
  import.meta.url,
).href;

const blendModes = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];

type JianggeTemplateOptions = {
  id: string;
  deviceKey: string;
  width: number;
  height: number;
  radius: number;
  glassSrc: string;
  borderSrc: string;
};

function createJianggeTemplate({
  id,
  deviceKey,
  width,
  height,
  radius,
  glassSrc,
  borderSrc,
}: JianggeTemplateOptions) {
  return {
    id,
    watchface: {
      name: '匠格',
      previewKey: 'jiangge',
    },
    deviceKey,
    canvas: {
      width,
      height,
      background: 'transparent',
    },
    frame: {
      x: 0,
      y: 0,
      width,
      height,
      radius,
    },
    preview: {
      radius,
    },
    wallpaperTransform: {
      scale: {
        default: 1,
        min: 1,
        max: 4,
        step: 0.01,
      },
      rotation: {
        default: 0,
        min: 0,
        max: 0,
        step: 1,
      },
    },
    layers: [
      {
        id: 'photo',
        name: '壁纸',
        type: 'wallpaper',
        clip: 'frame',
        blur: {
          default: 0,
          min: 0,
          max: 24,
          step: 1,
          adjustable: true,
        },
      },
      {
        id: 'glass',
        name: '玻璃层',
        type: 'asset',
        src: glassSrc,
        clip: 'frame',
        blendMode: {
          default: 'darken',
          adjustable: true,
          options: blendModes,
        },
      },
      {
        id: 'border',
        name: '分割线',
        type: 'asset',
        src: borderSrc,
        clip: 'frame',
        blendMode: {
          default: 'color-burn',
          adjustable: true,
          options: blendModes,
        },
      },
    ],
  };
}

const wallpaperConfig = {
  version: 1,
  templates: [
    createJianggeTemplate({
      id: 'jiangge-o67',
      deviceKey: 'o67',
      width: 336,
      height: 480,
      radius: 56,
      glassSrc: bandProGlass,
      borderSrc: bandProBorder,
    }),
    createJianggeTemplate({
      id: 'jiangge-o65',
      deviceKey: 'o65',
      width: 432,
      height: 514,
      radius: 103,
      glassSrc: redmiWatchGlass,
      borderSrc: redmiWatchBorder,
    }),
  ],
};

export const layoutTemplates = normalizeWallpaperConfig(wallpaperConfig, import.meta.url);
export const defaultTemplate = layoutTemplates[0];
export type LayoutTemplate = (typeof layoutTemplates)[number];

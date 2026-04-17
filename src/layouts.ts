export type LayoutTemplate = {
  id: string;
  watchface: {
    name: string;
    previewKey: string;
  };
  deviceKey: string;
  canvas: {
    width: number;
    height: number;
    background: string;
  };
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  };
  preview: {
    radius: number;
  };
};

export const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'lumetrace-o66',
    watchface: {
      name: '拾光成影',
      previewKey: 'lumetrace',
    },
    deviceKey: 'o66',
    canvas: {
      width: 212,
      height: 520,
      background: '#F3F3F3',
    },
    frame: {
      x: 11,
      y: 105,
      width: 190,
      height: 208,
      radius: 8,
    },
    preview: {
      radius: 103,
    },
  },
];

export const defaultTemplate = layoutTemplates[0];

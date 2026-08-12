export type DevicePreset = {
  key: string;
  name: string;
  category: 'band' | 'watch';
};

export const devicePresets: DevicePreset[] = [
  { key: 'l66', name: '小米手环 7', category: 'band' },
  { key: 'l67', name: '小米手环 7Pro', category: 'band' },
  { key: 'm66', name: '小米手环 8/9', category: 'band' },
  { key: 'm67', name: '小米手环 8Pro', category: 'band' },
  { key: 'n66', name: '小米手环 8/9', category: 'band' },
  { key: 'n67', name: '小米手环 9Pro / 10Pro', category: 'band' },
  { key: 'o66', name: '小米手环 10', category: 'band' },
  { key: 'o67', name: '小米手环 9Pro / 10Pro', category: 'band' },
  { key: 'n62', name: 'Xiaomi Watch S3/S4', category: 'watch' },
  { key: 'o62', name: 'Xiaomi Watch S3/S4', category: 'watch' },
  { key: 'p62', name: 'Xiaomi Watch S5', category: 'watch' },
  { key: 'o61', name: 'Xiaomi Watch 5', category: "watch" },
  { key: 'n65', name: 'Redmi Watch 4', category: 'watch' },
  { key: 'o65', name: 'REDMI Watch 5/6', category: 'watch' },
  { key: 'p65', name: 'REDMI Watch 5/6', category: 'watch' },
];

export const devicePresetMap = new Map(devicePresets.map((item) => [item.key, item]));

export function getDevicePreset(deviceKey: string) {
  return devicePresetMap.get(deviceKey) ?? null;
}

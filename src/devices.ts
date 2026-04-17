export type DevicePreset = {
  key: string;
  name: string;
  category: 'band' | 'watch';
};

export const devicePresets: DevicePreset[] = [
  { key: 'l66', name: '小米手环7', category: 'band' },
  { key: 'l67', name: '小米手环7 Pro', category: 'band' },
  { key: 'm66', name: '小米手环8', category: 'band' },
  { key: 'm67', name: '小米手环8 Pro', category: 'band' },
  { key: 'n66', name: '小米手环9', category: 'band' },
  { key: 'n67', name: '小米手环9 Pro', category: 'band' },
  { key: 'o66', name: '小米手环10', category: 'band' },
  { key: 'n62', name: 'Xiaomi Watch S3', category: 'watch' },
  { key: 'o62', name: 'Xiaomi Watch S4', category: 'watch' },
  { key: 'p62', name: 'Xiaomi Watch S5', category: 'watch' },
  { key: 'o61', name: 'Xiaomi Watch 5', category: "watch" },
  { key: 'n65', name: 'Redmi Watch 4', category: 'watch' },
  { key: 'o65', name: 'REDMI Watch 5', category: 'watch' },
  { key: 'p65', name: 'REDMI Watch 6', category: 'watch' },
];

export const devicePresetMap = new Map(devicePresets.map((item) => [item.key, item]));

export function getDevicePreset(deviceKey: string) {
  return devicePresetMap.get(deviceKey) ?? null;
}

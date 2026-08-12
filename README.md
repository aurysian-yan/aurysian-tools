# AurysianTools

用于生成匠格表盘壁纸的浏览器工具。

## 功能

- 支持小米手环 9 Pro、小米手环 10 Pro、REDMI Watch 5 和 REDMI Watch 6
- 支持图片拖动、缩放、模糊和图层混合模式调整
- 使用 `@claralight-design/wallpaper-engine` 完成配置解析、预览合成和 PNG 导出
- 图片仅在浏览器本地读取和处理

## 开发

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
```

## 模板

匠格模板位于 `src/layouts.ts`，使用 Wallpaper Engine 的版本 1 配置格式。每个设备模板由壁纸、玻璃层和分割线三个图层组成，并通过引擎的 Frame 裁切保持设备外形。

页面会把当前设备同步到 URL：

```text
?watchface=jiangge&device=o67
```

## 隐私

导入图片后，应用通过浏览器本地对象 URL 读取文件，并在本地 Canvas 中生成 PNG。图片不会上传到项目服务器或第三方图片处理服务。

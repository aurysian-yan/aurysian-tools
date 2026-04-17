# LumeTrace-Wallpaper-Generator

一个用于生成拾光成影（LumeTrace）表盘壁纸的小工具。

## 隐私说明

当前版本会在用户设备上的浏览器内本地读取、预览和导出图片，不会把用户选中的图片上传到项目服务器或第三方图片处理服务。

- 导入图片后，前端通过浏览器本地对象 URL 读取文件
- 导出结果时，前端直接在浏览器 `canvas` 中生成 PNG
- 页面本身仍会从当前部署站点加载前端代码与静态资源

项目源码公开在 GitHub：

`https://github.com/aurysian-yan/aurysian-tools`

## 模板参数

模板定义在 `src/layouts.ts`，每个模板对象包含这些字段：

- `id`: 模板唯一标识
- `watchface.name`: 表盘显示名称
- `watchface.previewKey`: 表盘对应的 preview 文件名前半段
- `deviceKey`: 设备三位短 key，对应 `src/devices.ts`
- `canvas.width`: 最终导出画布宽度
- `canvas.height`: 最终导出画布高度
- `canvas.background`: 预览和导出共用的画布背景色，直接传 hex 色值，例如 `#ffffff`
- `preview.radius`: 仅用于前端整张预览画布的圆角半径，不参与导出
- `frame.x`: 可编辑窗口相对于画布左上角的横向偏移
- `frame.y`: 可编辑窗口相对于画布左上角的纵向偏移
- `frame.width`: 可编辑窗口宽度
- `frame.height`: 可编辑窗口高度
- `frame.radius`: 可编辑窗口圆角半径，前端预览和导出 PNG 都会应用

## 当前模板

当前内置模板为 `拾光成影 - 小米手环 10`：

```ts
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
    background: '#ffffff',
  },
  preview: {
    radius: 103,
  },
  frame: {
    x: 11,
    y: 105,
    width: 190,
    height: 208,
    radius: 8,
  },
}
```

设备预设放在 `src/devices.ts`。对应的 preview 图会自动按 `watchface.previewKey + "." + deviceKey + ".png"` 组合，所以这个模板会匹配 `src/preview/lumetrace.o66.png`。

## URL 参数

页面会把当前选择同步到 URL，你也可以直接带参数打开指定组合：

- `watchface`: 表盘的 `previewKey`
- `device`: 设备三位短 key

例如：

`?watchface=lumetrace&device=o66`

新增模板时，继续在 `src/layouts.ts` 里追加对象即可。

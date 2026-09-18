# 生活照片目录

按 `年份/月` 保存照片，例如：

```text
images/life/
└── 2026/
    ├── 09/
    │   ├── 0913-01.jpg
    │   └── thumbs/
    │       └── 0913-01.jpg
    └── 07/
        ├── 0702-01.jpg
        └── thumbs/
            └── 0702-01.jpg
```

网页文件统一使用 `MMDD-序号.jpg` 命名，缩略图放在同月的 `thumbs` 目录。HEIC 原片保留在本地作为源文件，并由 `.gitignore` 排除，不会部署到 GitHub Pages。

生活记录按月份统一维护在 `js/life-data.js`。同一个月的照片集中放进同一个 `photos` 数组；`src` 用于灯箱原图，`thumb` 用于列表缩略图。图片会自动使用 `loading="lazy"` 与 `decoding="async"`。

## 添加文字说明

每个月可通过 `text` 添加一条碎碎念文字，留空时不会显示便签：

```js
{
  month: '2026-07',
  text: '这里填写这个月想留下的话。',
  photos: [
    {
      src: '../images/life/2026/07/0710-01.jpg',
      thumb: '../images/life/2026/07/thumbs/0710-01.jpg',
      caption: '这里填写单张照片自己的说明。'
    }
  ]
}
```

`caption` 是单张照片下方的可选说明。`text` 或 `caption` 为空时不会显示占位内容。

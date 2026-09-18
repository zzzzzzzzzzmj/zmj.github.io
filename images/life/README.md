# 生活照片目录

按 `年份/月` 保存照片，例如：

```text
images/life/
└── 2026/
    ├── 09/
    │   ├── 0914-01.jpg
    │   └── thumbs/
    │       └── 0914-01.jpg
    └── 07/
        ├── 0702-01.jpg
        └── thumbs/
            └── 0702-01.jpg
```

网页文件统一使用 `MMDD-序号.jpg` 命名，缩略图放在同月的 `thumbs` 目录。HEIC 原片保留在本地作为源文件，并由 `.gitignore` 排除，不会部署到 GitHub Pages。

生活记录统一维护在 `js/life-data.js`。`src` 用于灯箱原图，`thumb` 用于列表缩略图。图片会自动使用 `loading="lazy"` 与 `decoding="async"`。

## 添加文字说明

每条记录可通过 `text` 添加整组照片的说明，并用 `notePosition` 控制位置：

```js
{
  date: '2026-07-10',
  location: '',
  text: '这里填写这一天的文字记录。',
  notePosition: 'side', // `side` 显示在右侧，省略或写 `below` 显示在图片下方
  photos: [
    {
      src: '../images/life/2026/07/0710-01.jpg',
      thumb: '../images/life/2026/07/thumbs/0710-01.jpg',
      caption: '这里填写单张照片自己的说明。'
    }
  ]
}
```

手机端的右侧说明会自动移动到照片下方。`text` 或 `caption` 为空时不会显示占位内容。

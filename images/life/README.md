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

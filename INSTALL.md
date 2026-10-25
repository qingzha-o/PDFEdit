说明：安装包约 128 MB，超过 GitHub 单文件限制，未提交到源码仓库；请在本机 F:\DSH\PDFEdit\dist\ 目录使用。

Folio PDF Studio 1.0.0 — Windows x64
======================================

1. 一键安装
   双击：F:\DSH\PDFEdit\dist\Folio-PDF-Studio-Setup-1.0.0.exe
   安装位置：F:\DSH\PDFEdit\app（读取 FOLIO_RUNTIME）
   应用数据：F:\DSH\PDFEdit\data（读取 FOLIO_DATA）
   安装完成后在桌面和开始菜单创建 “Folio PDF Studio” 快捷方式。
   不需要管理员权限，不会上传 PDF。

2. 卸载
   开始菜单 → Uninstall Folio PDF Studio
   或：Windows 设置 → 应用 → 已安装的应用 → Folio PDF Studio

3. 当前电脑已迁移
   源码 / 应用根目录：F:\DSH\PDFEdit
   桌面程序：F:\DSH\PDFEdit\app\Folio PDF Studio.exe
   数据目录：F:\DSH\PDFEdit\data
   网页版：cd F:\DSH\PDFEdit，运行 start.cmd，访问 http://127.0.0.1:4173

4. 环境变量
   FOLIO_HOME=F:\DSH\PDFEdit
   FOLIO_RUNTIME=F:\DSH\PDFEdit\app
   FOLIO_DATA=F:\DSH\PDFEdit\data
   FOLIO_PORT=4173
   FOLIO_HOST=127.0.0.1

5. 功能提示
   - 打开 PDF 后，顶部文件名右侧的文件夹按钮可切换另一份 PDF（Ctrl+O）。
   - 右侧 OCR 可识别当前页或本地图片；首次识别会加载约 30MB 离线语言包。
   - 扫描页识别后点「转为可编辑页」，会按原行位置/字号/颜色重建可编辑文本，尽量保持格式。
   - 也可以复制文字或生成独立的干净文字页。
   - 关闭客户端时若有未应用修改，会弹出确认框；选择「退出」即可正常关闭。

6. 说明
   - 支持 Windows 10 / 11 x64。
   - 安装包未购买代码签名证书；若 SmartScreen 提示 “已保护你的电脑”，
     点击 “更多信息 → 仍要运行”。
   - 如果安装包被安全软件拦截，可直接使用已部署的桌面快捷方式。

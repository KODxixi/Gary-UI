# 维护与发布

公开源码仓库：[KODxixi/Gary-UI](https://github.com/KODxixi/Gary-UI)。在线完整 Demo：[GitHub Pages](https://kodxixi.github.io/Gary-UI/)。源码采用 MIT，第三方条款见 [许可声明](../THIRD_PARTY_NOTICES.md)。

## 从公开克隆继续深化

1. Fork 或克隆公开仓库，在分支上修改。按 [贡献说明](../CONTRIBUTING.md) 预览、验证交互和记录视觉取舍。
2. 执行 `python scripts/check_public.py`、预览服务测试和公开页面浏览器检查。更换光学或动态背景时，另跑 `node scripts/public_surfaces_qa.mjs`。
3. 在本地构建静态站点，并在 `/Gary-UI/` 子路径验证六个 Demo、首页和 Portal。提交 PR 时附实际检查结果。
4. 经审查的改动进入 `main` 后，由 GitHub Pages 内建流程发布根目录。提交前仍必须完成本地检查；内建 Pages 构建不会替你运行这些产品检查。

当前 Pages Source 为 **Deploy from a branch → main → /(root)**，根 `.nojekyll` 保持静态资源原样发布。Fork 到其他仓库时，先更新 README 与根 `index.html` 中的站点地址，再启用自己的 Pages。

首次发布时，当前 GitHub 登录缺少创建自定义工作流所需的 `workflow` 权限，因此没有启用自定义 Actions 检查。完整模板保留在 [pages-workflow.yml](automation/pages-workflow.yml)：获得相应权限后，可在自己的仓库配置 `.github/workflows/pages.yml`，再把 Pages Source 改为 GitHub Actions。模板包含锁定依赖、浏览器检查、子路径验收及检查通过后的部署；当前状态不能表述成它已经自动执行。

## 维护者的本机母本

维护者目前的源目录为 `C:\AI\UI\gary-ui`，其父目录另有大仓库。这个环境约定不要求公开贡献者遵循，也不能把父仓库历史推送到 Gary-UI。

从母本制作公开候选：

```powershell
python C:\AI\UI\gary-ui\scripts\build_public.py --output C:\tmp\Gary-UI-candidate-new
python C:\tmp\Gary-UI-candidate-new\scripts\check_public.py
python C:\tmp\Gary-UI-candidate-new\scripts\preview.py --port 4187
```

输出目录必须新建或为空。导出会排除受限历史实现、机器回执、私有路径类别和父仓库历史，并生成 `public-source-manifest.json`。它只构造源码候选，不会执行提交、推送或部署。

后续发布应克隆公开仓库到独立工作目录，对照候选的清单和差异更新其中的源码，保留该克隆自己的 `.git` 与远端历史。核对新增、修改和删除文件，重新运行公开检查，再正常提交和推送；不重复初始化远端、不强推，也不覆盖其他贡献者的工作。

首次公开快照中的清单记录当时文件哈希；后续直接在公开仓库发展的版本以 Git 提交为准。母本再次导出时重新生成清单。

## 发布后复验

检查 Pages 构建最终状态和实际站点：六个完整页面能打开，深浅主题与 Background 功能独立，模板生成物可独立加载，制图源与导出链接有效。浏览器检查支持 `GARY_UI_BASE_URL`；本机非默认浏览器路径可设置 `GARY_UI_CHROME`。

验收记录写入 [PUBLIC_RELEASE.md](PUBLIC_RELEASE.md)。已有数据问题仍需按 [路线图](ROADMAP.md) 的关闭条件专项验证；公共页面检查通过不代表这些问题已关闭。

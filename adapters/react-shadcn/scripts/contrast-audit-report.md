# Gary-UI 对比度审计报告（WCAG 2.x）

源：`tokens/tokens.json` ｜ 文本 token：`--gary-text-*` ｜ 背景：surface-page / solid-plate / surface-sunken / glass-ultrathin·regular·thick。
半透明 token 先在 `--gary-surface-page` 上做 alpha 合成再测亮度，比值为用户实际看到的颜色。

阈值：AA 正文 ≥ 4.5，AA 大字 ≥ 3.0，AAA 正文 ≥ 7.0，AAA 大字 ≥ 4.5。

门禁：非豁免 `--gary-text-*` 在任一背景上低于 AA 正文 4.5 即 exit 1；`--gary-text-faint` 为装饰豁免（见文末）。

## DARK 模式

| 文本 | 背景 | 比值 | AA 正文 | AA 大字 | AAA 正文 | AAA 大字 |
| --- | --- | ---: | :---: | :---: | :---: | :---: |
| `--gary-text-primary` | `--gary-surface-page` | 15.25 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-solid-plate` | 15.46 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-surface-sunken` | 14.72 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-ultrathin` | 15.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-regular` | 15.39 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-thick` | 15.35 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-surface-page` | 8.30 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-solid-plate` | 8.36 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-surface-sunken` | 8.12 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-ultrathin` | 8.33 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-regular` | 8.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-thick` | 8.33 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-tertiary` | `--gary-surface-page` | 4.68 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-solid-plate` | 4.68 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-surface-sunken` | 4.65 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-ultrathin` | 4.68 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-regular` | 4.68 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-thick` | 4.68 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-strong` | `--gary-surface-page` | 17.75 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-solid-plate` | 18.01 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-surface-sunken` | 17.09 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-glass-ultrathin` | 17.86 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-glass-regular` | 17.93 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-glass-thick` | 17.88 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-surface-page` | 14.84 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-solid-plate` | 15.06 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-surface-sunken` | 14.29 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-glass-ultrathin` | 14.93 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-glass-regular` | 14.99 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-glass-thick` | 14.95 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-surface-page` | 9.40 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-solid-plate` | 9.53 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-surface-sunken` | 9.04 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-glass-ultrathin` | 9.45 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-glass-regular` | 9.49 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-glass-thick` | 9.46 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-caption` | `--gary-surface-page` | 6.04 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-solid-plate` | 6.13 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-surface-sunken` | 5.82 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-glass-ultrathin` | 6.08 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-glass-regular` | 6.11 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-glass-thick` | 6.09 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-faint` | `--gary-surface-page` | 3.88 | ❌ Fail | ✅ Pass | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-solid-plate` | 3.93 | ❌ Fail | ✅ Pass | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-surface-sunken` | 3.73 | ❌ Fail | ✅ Pass | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-glass-ultrathin` | 3.90 | ❌ Fail | ✅ Pass | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-glass-regular` | 3.91 | ❌ Fail | ✅ Pass | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-glass-thick` | 3.90 | ❌ Fail | ✅ Pass | ❌ Fail | ❌ Fail |

## LIGHT 模式

| 文本 | 背景 | 比值 | AA 正文 | AA 大字 | AAA 正文 | AAA 大字 |
| --- | --- | ---: | :---: | :---: | :---: | :---: |
| `--gary-text-primary` | `--gary-surface-page` | 12.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-solid-plate` | 12.06 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-surface-sunken` | 11.70 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-ultrathin` | 12.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-regular` | 12.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-thick` | 12.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-surface-page` | 5.62 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-solid-plate` | 5.55 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-surface-sunken` | 5.46 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-ultrathin` | 5.62 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-regular` | 5.62 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-thick` | 5.62 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-surface-page` | 4.71 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-solid-plate` | 4.66 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-surface-sunken` | 4.60 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-ultrathin` | 4.71 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-regular` | 4.71 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-thick` | 4.71 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-strong` | `--gary-surface-page` | 16.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-solid-plate` | 15.93 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-surface-sunken` | 15.41 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-glass-ultrathin` | 16.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-glass-regular` | 16.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-strong` | `--gary-glass-thick` | 16.34 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-surface-page` | 12.87 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-solid-plate` | 12.55 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-surface-sunken` | 12.14 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-glass-ultrathin` | 12.87 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-glass-regular` | 12.87 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-body` | `--gary-glass-thick` | 12.87 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-surface-page` | 7.02 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-solid-plate` | 6.85 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-meta` | `--gary-surface-sunken` | 6.62 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-meta` | `--gary-glass-ultrathin` | 7.02 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-glass-regular` | 7.02 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-meta` | `--gary-glass-thick` | 7.02 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-caption` | `--gary-surface-page` | 4.98 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-solid-plate` | 4.86 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-surface-sunken` | 4.70 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-glass-ultrathin` | 4.98 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-glass-regular` | 4.98 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-caption` | `--gary-glass-thick` | 4.98 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-faint` | `--gary-surface-page` | 2.72 | ❌ Fail | ❌ Fail | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-solid-plate` | 2.65 | ❌ Fail | ❌ Fail | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-surface-sunken` | 2.56 | ❌ Fail | ❌ Fail | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-glass-ultrathin` | 2.72 | ❌ Fail | ❌ Fail | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-glass-regular` | 2.72 | ❌ Fail | ❌ Fail | ❌ Fail | ❌ Fail |
| `--gary-text-faint` | `--gary-glass-thick` | 2.72 | ❌ Fail | ❌ Fail | ❌ Fail | ❌ Fail |

## 门禁未达标项（非豁免 token，未过 AA 正文 4.5:1 → exit 1）

无 — 所有非豁免组合均通过 AA 正文门槛。

## 装饰豁免项（设计决定，不计入门禁）

`--gary-text-faint` 是装饰性最低强调层，不承载必要信息（DESIGN.md 三级层次定位）。
设计决定：保持低对比以维持三级层次，不调亮、不删除检查，仅豁免 AA 正文门禁。实测如下：

| 模式 | 文本 | 背景 | 比值 |
| --- | --- | --- | ---: |
| dark | `--gary-text-faint` | `--gary-surface-page` | 3.88 |
| dark | `--gary-text-faint` | `--gary-solid-plate` | 3.93 |
| dark | `--gary-text-faint` | `--gary-surface-sunken` | 3.73 |
| dark | `--gary-text-faint` | `--gary-glass-ultrathin` | 3.90 |
| dark | `--gary-text-faint` | `--gary-glass-regular` | 3.91 |
| dark | `--gary-text-faint` | `--gary-glass-thick` | 3.90 |
| light | `--gary-text-faint` | `--gary-surface-page` | 2.72 |
| light | `--gary-text-faint` | `--gary-solid-plate` | 2.65 |
| light | `--gary-text-faint` | `--gary-surface-sunken` | 2.56 |
| light | `--gary-text-faint` | `--gary-glass-ultrathin` | 2.72 |
| light | `--gary-text-faint` | `--gary-glass-regular` | 2.72 |
| light | `--gary-text-faint` | `--gary-glass-thick` | 2.72 |

# Gary-UI 对比度审计报告（WCAG 2.x）

源：`tokens/tokens.json` ｜ 文本 token：`--gary-text-*` ｜ 背景：surface-page / solid-plate / surface-sunken / glass-ultrathin·regular·thick。
半透明 token 先在 `--gary-surface-page` 上做 alpha 合成再测亮度，比值为用户实际看到的颜色。

阈值：AA 正文 ≥ 4.5，AA 大字 ≥ 3.0，AAA 正文 ≥ 7.0，AAA 大字 ≥ 4.5。

## DARK 模式

| 文本 | 背景 | 比值 | AA 正文 | AA 大字 | AAA 正文 | AAA 大字 |
| --- | --- | ---: | :---: | :---: | :---: | :---: |
| `--gary-text-primary` | `--gary-surface-page` | 15.99 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-solid-plate` | 15.56 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-surface-sunken` | 16.18 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-ultrathin` | 15.94 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-regular` | 15.91 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-thick` | 15.79 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-surface-page` | 8.50 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-solid-plate` | 8.39 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-surface-sunken` | 8.54 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-ultrathin` | 8.49 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-regular` | 8.48 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-thick` | 8.45 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-tertiary` | `--gary-surface-page` | 4.66 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-solid-plate` | 4.68 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-surface-sunken` | 4.65 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-ultrathin` | 4.67 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-regular` | 4.67 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-thick` | 4.67 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |

## LIGHT 模式

| 文本 | 背景 | 比值 | AA 正文 | AA 大字 | AAA 正文 | AAA 大字 |
| --- | --- | ---: | :---: | :---: | :---: | :---: |
| `--gary-text-primary` | `--gary-surface-page` | 12.66 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-solid-plate` | 12.09 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-surface-sunken` | 11.12 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-ultrathin` | 12.59 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-regular` | 12.55 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-primary` | `--gary-glass-thick` | 12.51 | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| `--gary-text-secondary` | `--gary-surface-page` | 5.70 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-solid-plate` | 5.56 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-surface-sunken` | 5.31 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-ultrathin` | 5.68 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-regular` | 5.67 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-secondary` | `--gary-glass-thick` | 5.66 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-surface-page` | 5.01 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-solid-plate` | 4.90 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-surface-sunken` | 4.71 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-ultrathin` | 5.00 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-regular` | 4.99 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |
| `--gary-text-tertiary` | `--gary-glass-thick` | 4.98 | ✅ Pass | ✅ Pass | ❌ Fail | ✅ Pass |

## 不达标项（未过 AA 正文 4.5:1）

无 — 所有组合均通过 AA 正文门槛。

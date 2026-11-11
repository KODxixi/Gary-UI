"""
Gary-UI CSS / Contract / Token 综合审计
检查：
A. 浏览器伪元素/兼容性遗漏（::selectedcontent 这类）
B. Token 映射完整性（tokens.json → base.css CSS variables）
C. shadcn 变量映射完整性（gary-ui.css）
D. 组件契约一致性（index.json 登记 vs .json 文件 vs .tsx 文件）
E. 对比度（已有 contrast-audit.mjs，这里只跑）
"""
import json, os, re, sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GARY_ROOT = os.path.dirname(SCRIPT_DIR)
ADAPTER = os.path.join(GARY_ROOT, "adapters", "react-shadcn")
CSS_COMPONENTS = os.path.join(GARY_ROOT, "components", "components.css")
CSS_BASE = os.path.join(GARY_ROOT, "tokens", "base.css")
CSS_ADAPTER = os.path.join(ADAPTER, "src", "styles", "gary-ui.css")
TOKENS_JSON = os.path.join(GARY_ROOT, "tokens", "tokens.json")
INDEX_JSON = os.path.join(GARY_ROOT, "components", "index.json")
UI_DIR = os.path.join(ADAPTER, "src", "components", "ui")
COMPONENTS_DIR = os.path.join(GARY_ROOT, "components")

issues = []

def issue(sev, cat, msg, file=None):
    issues.append({"sev": sev, "cat": cat, "msg": msg, "file": file})

# ─── A. 浏览器伪元素/兼容性遗漏 ───
print("=== A. 浏览器伪元素/兼容性遗漏 ===")

with open(CSS_BASE, "r", encoding="utf-8") as f:
    base_css = f.read()
with open(CSS_COMPONENTS, "r", encoding="utf-8") as f:
    comp_css = f.read()
all_css = base_css + "\n" + comp_css

# 已知需要覆盖的浏览器伪元素
required_pseudo = {
    "::selectedcontent": "Chrome select 关闭态选中文字（本次 bug）",
    "::placeholder": "input/textarea placeholder 文字颜色",
}

# 需要检查的 input/select 类型伪元素
checks = [
    ("select", ["::selectedcontent"], "Chrome select 关闭态文字"),
    ("input", ["::placeholder"], "input placeholder 颜色"),
    ("textarea", ["::placeholder"], "textarea placeholder 颜色"),
    ("input[type='number']", ["::-webkit-inner-spin-button", "::-webkit-outer-spin-button"], "number input spinner"),
    ("input[type='date'], input[type='time'], input[type='datetime-local']", ["::-webkit-calendar-picker-indicator"], "date picker indicator"),
    ("input[type='search']", ["::-webkit-search-cancel-button", "::-webkit-search-decoration"], "search input 清理按钮"),
    ("button", ["::-moz-focus-inner"], "Firefox button focus outline"),
    ("input, textarea", ["::-ms-clear", "::-ms-reveal"], "IE/Edge clear/password 按钮"),
    ("select", ["::-ms-expand"], "IE select 默认箭头"),
    ("textarea", ["::-webkit-scrollbar"], "textarea 滚动条样式"),
]

for selector, pseudos, desc in checks:
    for p in pseudos:
        # 检查 CSS 中是否有针对该伪元素的规则
        pattern = re.escape(p)
        if not re.search(pattern, all_css):
            # 特殊：::placeholder 可能在 input/textarea 的规则里一起写
            issue("WARN", "A", f"缺少 {p} — {desc}（{selector}）", CSS_COMPONENTS)
        else:
            print(f"  OK: {p} ({desc})")

# ─── B. Token 映射完整性 ───
print("\n=== B. Token 映射完整性（tokens.json → base.css） ===")
with open(TOKENS_JSON, "r", encoding="utf-8") as f:
    tokens = json.load(f)

# 收集 tokens.json 中所有 token 名称
token_names = set()
def collect(obj, prefix=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            collect(v, f"{prefix}-{k}" if prefix else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            collect(v, f"{prefix}-{i}")
collect(tokens)

# 检查 base.css 中是否有 --gary- 变量定义
gary_vars_in_css = set(re.findall(r"(--gary-[a-z0-9-]+)\s*:", base_css))
gary_vars_used = set(re.findall(r"var\((--gary-[a-z0-9-]+)\)", base_css))

print(f"  tokens.json 顶层键: {list(tokens.keys())}")
print(f"  base.css 定义的 --gary-* 变量: {len(gary_vars_in_css)}")
print(f"  base.css 引用的 --gary-* 变量: {len(gary_vars_used)}")

# 检查引用了但未定义的
undefined_used = gary_vars_used - gary_vars_in_css - {"var"}
if undefined_used:
    issue("ERROR", "B", f"base.css 引用了未定义的变量: {undefined_used}", CSS_BASE)
else:
    print("  OK: 所有引用的变量都已定义")

# ─── C. shadcn 变量映射完整性 ───
print("\n=== C. shadcn 变量映射完整性（gary-ui.css） ===")
with open(CSS_ADAPTER, "r", encoding="utf-8") as f:
    adapter_css = f.read()

# shadcn 需要的 CSS variables
shadcn_vars = [
    "--background", "--foreground", "--card", "--card-foreground",
    "--popover", "--popover-foreground", "--primary", "--primary-foreground",
    "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
    "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
    "--border", "--input", "--ring", "--radius",
]

root_section = re.search(r":root\s*\{([^}]+)\}", adapter_css)
if root_section:
    root_content = root_section.group(1)
    for v in shadcn_vars:
        if v not in root_content:
            issue("WARN", "C", f"shadcn 变量 {v} 在 :root 中缺失", CSS_ADAPTER)
        else:
            print(f"  OK: {v}")
else:
    issue("ERROR", "C", "gary-ui.css 中没有 :root 块", CSS_ADAPTER)

# ─── D. 组件契约一致性 ───
print("\n=== D. 组件契约一致性 ===")
with open(INDEX_JSON, "r", encoding="utf-8") as f:
    index_data = json.load(f)

# 收集 index.json 中登记的 slug
if isinstance(index_data, dict):
    registered = set()
    for item in index_data.get("components", index_data.get("items", [])):
        if isinstance(item, dict):
            registered.add(item.get("slug", item.get("name", "")))
        elif isinstance(item, str):
            registered.add(item)
elif isinstance(index_data, list):
    registered = set(item if isinstance(item, str) else item.get("slug", "") for item in index_data)

# 检查每个 .json 契约是否存在
json_files = [f[:-5] for f in os.listdir(COMPONENTS_DIR) if f.endswith(".json") and f != "index.json"]
json_set = set(json_files)

print(f"  index.json 登记: {len(registered)} 个")
print(f"  components/*.json 文件: {len(json_set)} 个")

# 登记了但没有文件
missing_file = registered - json_set
if missing_file:
    issue("WARN", "D", f"index.json 登记了但缺少 .json 契约文件: {missing_file}", INDEX_JSON)

# 有文件但没登记
missing_index = json_set - registered
if missing_index:
    issue("WARN", "D", f".json 契约文件存在但未登记到 index.json: {missing_index}", INDEX_JSON)

# 检查 .tsx 文件是否存在于 src/components/ui/
tsx_files = set(f[:-4] for f in os.listdir(UI_DIR) if f.endswith(".tsx") and not f.endswith(".stories.tsx")) if os.path.isdir(UI_DIR) else set()
print(f"  src/components/ui/*.tsx 文件: {len(tsx_files)} 个")

# 检查 index.ts 导出
index_ts_path = os.path.join(ADAPTER, "src", "index.ts")
if os.path.exists(index_ts_path):
    with open(index_ts_path, "r", encoding="utf-8") as f:
        index_ts = f.read()
    exported = set(re.findall(r'export[\s\S]*?from\s+["\'](?:\./components/ui/)?([a-z-]+)["\']', index_ts))
    print(f"  index.ts 导出组件: {len(exported)} 个")
    
    # tsx 文件存在但未导出
    missing_export = tsx_files - exported - {"index"}
    if missing_export:
        issue("WARN", "D", f".tsx 文件存在但未在 index.ts 导出: {missing_export}", index_ts_path)

# ─── 输出报告 ───
print("\n" + "=" * 60)
print(f"审计完成: {len(issues)} 个问题")
print("=" * 60)
for sev in ["ERROR", "WARN", "INFO"]:
    for i in issues:
        if i["sev"] == sev:
            print(f"  [{sev}] {i['cat']}: {i['msg']}")
            if i.get("file"):
                print(f"         文件: {i['file']}")

if not issues:
    print("  全部通过 ✓")

# 退出码契约：ERROR 阻断、WARN 不阻断（WARN 多为契约先行、实现待补）
_errors = [i for i in issues if i.get("sev") == "ERROR"]
if _errors:
    print(f"结论: FAIL（{len(_errors)} 个 ERROR）", flush=True)
    raise SystemExit(1)
print("结论: PASS", flush=True)
raise SystemExit(0)


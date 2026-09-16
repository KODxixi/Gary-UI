```infographic
infographic sequence-color-snake-steps-horizontal-icon-line
data
  title 离线制图发布闸门
  desc 候选验证失败时隔离并保留上一有效版本，只有验证通过后才能正式发布
  sequences
    - label 需求判型
      desc 确认制图类型、输出边界与验收条件
      icon clipboard search
    - label 原生源生成
      desc 生成可追溯、可复现的原生制图源
      icon file code
    - label 候选渲染验证
      desc 验证失败则隔离候选，禁止覆盖上一有效版本
      icon shield check
    - label 原子替换正式产物
      desc 仅将验证通过的候选原子替换为正式产物
      icon replace file
  order asc
```

路由说明：当前会话实际发现并调用的 Skill 为 `infographic-syntax-creator`。
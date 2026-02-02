# E2E 测试文档

这个项目的 E2E（端到端）测试使用 Playwright 框架，确保应用在各个浏览器和设备上正常工作。

## 测试文件结构

```
e2e/
├── dashboard.spec.ts       # Dashboard 主页测试
├── navigation.spec.ts      # 导航功能测试
├── responsive.spec.ts      # 响应式设计测试
├── api.spec.ts            # API 端点测试
├── helpers/
│   └── test-utils.ts      # 测试辅助函数
└── README.md              # 本文档
```

## 测试覆盖范围

### 1. Dashboard 测试 (`dashboard.spec.ts`)
- ✅ 页面标题和标题显示
- ✅ 统计卡片显示（会话数、消息数、工具调用、活跃天数）
- ✅ 刷新按钮功能
- ✅ 图表显示（活动趋势、模型使用、热门项目）
- ✅ 额外统计信息卡片
- ✅ 加载状态显示
- ✅ 响应式布局验证

### 2. API 测试 (`api.spec.ts`)
- ✅ JSON 响应验证
- ✅ 数据结构完整性检查
- ✅ 所有数据字段验证（stats, settings, history, plugins, mcp, plans, projects, debug, skills）
- ✅ CORS 处理
- ✅ 响应时间验证
- ✅ HTTP 方法正确性

### 3. 导航测试 (`navigation.spec.ts`)
- ✅ 侧边栏显示和功能
- ✅ 所有导航链接（9个页面）
- ✅ 页面跳转功能
- ✅ 活动状态高亮
- ✅ 侧边栏切换
- ✅ 浏览器前进/后退
- ✅ 键盘导航
- ✅ 刷新保持状态

### 4. 响应式测试 (`responsive.spec.ts`)
- ✅ 桌面视图 (1280x720)
- ✅ 平板视图 (768x1024)
- ✅ 移动视图 (375x667)
- ✅ 横屏/竖屏切换
- ✅ 大屏幕 (1920x1080)
- ✅ 触摸友好导航
- ✅ 无障碍访问

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm test

# 以 UI 模式运行（推荐用于开发）
npm run test:ui

# 以有头模式运行（可以看到浏览器）
npm run test:headed

# 调试模式
npm run test:debug

# 查看测试报告
npm run test:report
```

### 运行特定测试

```bash
# 只运行 dashboard 测试
npx playwright test dashboard

# 只运行 API 测试
npx playwright test api

# 只运行导航测试
npx playwright test navigation

# 只运行响应式测试
npx playwright test responsive
```

### 运行特定浏览器的测试

```bash
# 只在 Chrome 上运行
npx playwright test --project=chromium

# 只在 Firefox 上运行
npx playwright test --project=firefox

# 只在 Safari 上运行
npx playwright test --project=webkit

# 在移动设备上运行
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## 配置

### Playwright 配置文件

`playwright.config.ts` 包含以下配置：

- ✅ 使用系统安装的 Chrome 浏览器（`channel: 'chrome'`）
- ✅ 自动启动开发服务器（`npm run dev`）
- ✅ 测试失败时自动截图
- ✅ 测试失败时保留视频
- ✅ 失败时重试（CI 环境）
- ✅ 支持 5 种浏览器配置（Chromium、Firefox、WebKit、Mobile Chrome、Mobile Safari）

### 环境变量

```bash
# CI 环境（自动配置）
CI=true

# 自定义 base URL
BASE_URL=http://localhost:3000
```

## 测试报告

测试运行后，HTML 报告会生成在 `playwright-report/index.html`。

```bash
# 查看报告
npm run test:report
```

报告包含：
- 测试结果摘要
- 每个测试的详细信息
- 失败测试的截图和视频
- 网络请求时间线
- 执行轨迹

## 添加新测试

### 1. 创建新的测试文件

```bash
# 在 e2e 目录创建新文件
touch e2e/mypage.spec.ts
```

### 2. 编写测试

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Page', () => {
  test('should display correctly', async ({ page }) => {
    await page.goto('/my-page');
    await expect(page.getByText('My Page')).toBeVisible();
  });
});
```

### 3. 运行新测试

```bash
npx playwright test mypage
```

## 最佳实践

### 1. 使用数据选择器

```typescript
// ✅ 好的做法 - 使用 role 和 name
await page.getByRole('button', { name: '提交' }).click();

// ❌ 避免 - 使用 CSS 选择器
await page.click('.btn-submit');
```

### 2. 等待元素

```typescript
// ✅ 显式等待
await page.waitForLoadState('networkidle');

// ✅ 使用自动等待（Playwright 默认）
await expect(page.getByText('加载完成')).toBeVisible();
```

### 3. 使用辅助函数

```typescript
import { waitForDataLoaded, navigateToPage } from './helpers/test-utils';

test('my test', async ({ page }) => {
  await navigateToPage(page, '/dashboard');
  // ... 测试逻辑
});
```

### 4. 测试隔离

每个测试应该是独立的，不依赖其他测试的结果。

### 5. 使用描述性的测试名称

```typescript
// ✅ 好的做法
test('should display error message when API fails', async ({ page }) => {
  // ...
});

// ❌ 避免
test('test1', async ({ page }) => {
  // ...
});
```

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 故障排除

### 问题：测试超时

```typescript
// 增加测试超时时间
test.setTimeout(60000); // 60 秒
```

### 问题：元素未找到

```typescript
// 使用 waitForSelector
await page.waitForSelector('.my-element', { timeout: 10000 });
```

### 问题：开发服务器未启动

```bash
# 手动启动服务器
npm run dev

# 在另一个终端运行测试
npm test
```

## 资源链接

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [Playwright API 参考](https://playwright.dev/docs/api/class-playwright)

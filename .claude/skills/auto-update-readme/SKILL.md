---
name: auto-update-readme
description: Automatically analyze project and update README with current information
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Auto-Update README Skill

自动分析项目结构并更新 README.md 的内容。

## Important: README Purpose

**README.md 只回答两个问题：**
1. 这个项目能干什么？（功能特性）
2. 怎么使用这个项目？（使用说明）

**README.md 不应该包含：**
- ❌ 组件库列表
- ❌ 项目结构说明
- ❌ 最近更新/变更日志
- ❌ 开发进度相关内容
- ❌ 技术实现细节（除非与使用相关）

## When to Use

此 skill 应该仅由 stop hook 在有 git 变更时自动调用。

## What to Update

只更新以下与**功能**和**使用**相关的部分：

1. **功能特性** - 扫描 app/ 目录下的页面，列出用户可用的功能
2. **可用页面** - 更新页面路由表（从 app/*/page.tsx 提取），帮助用户了解可以访问哪些页面
3. **技术栈** - 仅列出主要技术框架（Next.js、React 版本等），不需要列出所有依赖
4. **配置说明** - 用户需要了解的配置项（如环境变量、数据源位置等）

**绝对不要添加：**
- 组件库文档（开发者应该查看 components/ 目录）
- 项目目录结构（开发者应该查看文件系统）
- 最近更新（应该用 CHANGELOG.md 或 Git commit history）
- 版本号细节（除主要框架外）

## Process

1. 检查是否有 git 变更（通过 hook 前置检查）
2. 扫描 app/ 目录获取可访问的页面
3. 读取 package.json 获取主要框架版本（仅 Next.js、React、TypeScript 等核心依赖）
4. 更新 README.md 中与功能和使用相关的部分
5. 删除任何不属于功能说明或使用指南的内容

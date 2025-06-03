#!/bin/bash
# WSLでGitリポジトリを初期化するスクリプト

echo "Gitリポジトリを初期化しています..."

# Gitの設定
git config --global core.filemode false
git config --global core.autocrlf true
git config --global init.defaultBranch main

# リポジトリ初期化
git init -b main 2>/dev/null || git init

# 初期コミット
git add .gitignore README.md package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.js .gitattributes
git commit -m "chore: Next.js 14プロジェクトの初期設定

- Next.js 14 with App Router
- TypeScript設定
- Tailwind CSS設定
- 基本的な設定ファイル"

echo "Gitリポジトリの初期化が完了しました！"
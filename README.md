# 🎯 Valorant Mouse Sensitivity Utility

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Electron](https://img.shields.io/badge/Electron-37.3.0-47848F?logo=electron)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/electron/electron)
[![Version](https://img.shields.io/badge/Version-1.4.0-brightgreen)](https://github.com/saica1101/valorant-mouse-sensitivity-utility/releases)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-Refactored-success)](https://github.com/saica1101/valorant-mouse-sensitivity-utility)

Valorantプレイヤー向けの最適なマウス感度を見つけるためのElectronアプリケーションです。**三分探索アルゴリズム**と**Natural PSA（Practical Sensitivity Algorithm）**の2つの手法を使用して、効率的にあなたにぴったりの感度設定を発見できます。

**v1.4.0では大規模なリファクタリングを実施し、より保守しやすく拡張しやすいアーキテクチャに生まれ変わりました。**

## 🌐 多言語対応

- 🇯🇵 **日本語** - 完全対応
- 🇺🇸 **English** - Full support

## 📸 スクリーンショット
> NOTE: 画像は開発中の物であり実際の物とは異なる場合があります。

### ライトモード
![Light Mode Screenshot](./screenshots/app-light-mode.png)

### ダークモード  
![Dark Mode Screenshot](./screenshots/app-dark-mode.png)

### 使用デモ
![Demo GIF](./screenshots/app-demo.gif)

## ✨ 機能

- 🔍 **2つの感度探索アルゴリズム**:
  - **三分探索**: 効率的な数学的アプローチ
  - **Natural PSA**: より自然で直感的な調整手法
- 🌐 **多言語対応**: 日本語・英語の完全サポート + システム言語自動検出
- 🖱️ **DPI対応**: 400, 800, 1600, 3200の一般的なDPI値 + カスタム入力
- 🌙 **テーマ切り替え**: ライトモード・ダークモード対応
- 💾 **設定保存**: テーマ、言語、アルゴリズム設定の自動保存・復元
- 🎮 **Valorant特化**: ゲーム向けに最適化された感度計算
- 🔄 **自動アップデート**: GitHubリリースからの自動更新機能
- ♿ **アクセシビリティ**: キーボードナビゲーション、スクリーンリーダー対応
- 🎯 **パフォーマンス最適化**: 軽量でスムーズな動作
- ✅ **リアルタイムバリデーション**: 入力値の即座な検証とエラー表示
- 📱 **レスポンシブデザイン**: 様々な画面サイズに対応
- 🔧 **モジュラー設計**: 保守しやすい機能分割アーキテクチャ

## 🚀 クイックスタート

### ダウンロード
[クライアントのダウンロード](https://github.com/saica1101/valorant-mouse-sensitivity-utility/releases)

## 🎯 使用方法

### 初期設定
1. **言語選択**: メニューから日本語または英語を選択
2. **アルゴリズム選択**: メニューから使用する感度調整手法を選択
   - **三分探索**: 数学的に効率的な探索手法
   - **Natural PSA**: より自然で直感的な調整手法

### Step 1: DPI設定
- マウスのDPI値を入力するか、プリセット値（400, 800, 1600, 3200）から選択
- 「感度調整を開始」をクリック

### Step 2: 感度調整

#### 三分探索アルゴリズム
1. 2つの候補感度値（候補A、候補B）が表示されます
2. 各感度値をValorantで試して比較
3. より快適だと感じる方を選択:
   - 👈 **Aが快適**: 候補Aの方が好ましい場合
   - 👉 **Bが快適**: 候補Bの方が好ましい場合
   - 🟰 **どちらも同じ**: 両方とも同程度に快適な場合
4. 選択に基づいて次の候補が表示されます

#### Natural PSA（Perfect Sensitivity Approximation）
1. 現在の感度値が表示されます
2. Valorantでテストして、感度の調整が必要かを判断
3. 調整方向を選択:
   - 📈 **上げる**: 感度を高くしたい場合
   - 📉 **下げる**: 感度を低くしたい場合
   - ✅ **完了**: 現在の感度が最適な場合
4. 7回の反復で段階的に最適値に収束します

### Step 3: 完了
- 最適な感度が見つかると「Finish」メッセージが表示
- 「Reset」ボタンで新しい調整を開始可能
- 設定は自動的に保存され、次回起動時に復元されます

### 📱 メニュー機能
- **言語設定**: 日本語 ⇄ English の切り替え
- **アルゴリズム設定**: 三分探索 ⇄ Natural PSA の切り替え
- **テーマ設定**: ライトモード ⇄ ダークモード の切り替え

### 自動アップデート機能
- アプリ起動時と10分間隔で自動的に新しいバージョンをチェック
- 新しいバージョンが利用可能な場合、バックグラウンドで自動ダウンロード
- ダウンロード完了時にユーザーに通知し、再起動確認ダイアログを表示
- ユーザーの承認後、アプリが自動再起動してアップデートが適用

### ⚙️ 技術仕様

### アルゴリズム詳細

#### 三分探索アルゴリズム
```
base_sensi = 80
lower_bound = base_sensi / input_DPI
upper_bound = lower_bound * 8

# 三分点の計算
range = upper_bound - lower_bound
left_third = lower_bound + range / 3
right_third = lower_bound + (2 * range) / 3
```

感度調整は三分探索で行われ、探索範囲を3つに分割して2つの候補点で比較を行います。
ユーザーの選択に基づいて探索範囲を絞り込み、上限と下限の差が0.001未満になるまで継続されます。

**三分探索の利点:**
- 人間の感覚による判定エラーに対してロバスト
- 「どちらも同じ」という選択肢により、不確実な判断の影響を軽減
- PSAメソッドの理論に基づいた、より信頼性の高い感度探索

#### Natural PSA（Practical Sensitivity Algorithm）
```
# 初期設定
base_sensitivity = 280 / DPI #(Valorant Pro Playerの多くがeDPI280の近似値の為)
iterations = 7

# 各反復での調整
current_sensitivity = (selected_sensitivity + previous_d) / 2
adjustment_range = base_sensitivity * (0.6 ** iteration)
```

Natural PSAは7回の反復を通じて段階的に最適な感度に収束します。
各ステップで調整幅が縮小され、より精密な調整が可能になります。

**Natural PSAの利点:**
- より自然で直感的な調整プロセス
- 段階的な収束により精密な感度調整が可能
- 実際のゲームプレイに近い調整体験

### 技術スタック
- **フレームワーク**: Electron 37.3.0
- **言語**: TypeScript 5.9.2 (完全移行済み)
- **アーキテクチャ**: IPC-based script loading system
- **パッケージング**: ASAR archive support
- **UI**: HTML5, CSS3 (CSS Variables for theming)
- **国際化**: カスタムi18nシステム with localStorage persistence
- **IPC通信**: Electron IPC for main-renderer communication + dynamic script loading
- **設定管理**: JSON-based settings with auto-save/restore
- **パフォーマンス**: Optimized monitoring with conditional execution
- **型安全性**: 包括的なTypeScriptインターフェース定義
- **エラーハンドリング**: 階層化されたエラー処理とログシステム
- **アーキテクチャ**: モジュラー設計 with Manager pattern + TypeScript型安全性
- **型定義**: 包括的なTypeScriptインターフェース定義

### 🏗️ アーキテクチャ（v1.4.0 リファクタリング）

#### マネージャーベースアーキテクチャ
v1.4.0では、完全なTypeScript移行と共に、単一の巨大なクラスを以下の責任分離されたマネージャーに分割しました：

```
📁 scripts/managers/
├── 📄 BaseManager.ts          # 基底クラス（共通機能、型定義）
├── 📄 AlgorithmManager.ts     # アルゴリズム管理
├── 📄 UIManager.ts            # UI状態管理・フェーズ遷移
├── 📄 ValidationManager.ts    # 入力検証・バリデーション
├── 📄 NotificationManager.ts  # 通知システム
├── 📄 AccessibilityManager.ts # アクセシビリティ機能
├── 📄 PerformanceManager.ts   # パフォーマンス監視
└── 📄 ServiceContainer.ts     # 依存性注入コンテナ

📁 scripts/
├── 📄 app.ts                  # メインアプリケーション
├── 📄 config.ts               # 設定管理
├── 📄 i18n.ts                 # 国際化システム
├── 📄 accessibility.ts        # アクセシビリティ初期化
└── 📄 performance.ts          # パフォーマンス初期化

📁 types/
└── 📄 index.ts                # TypeScript型定義
```

#### IPC-Based Script Loading System
ERR_FILE_NOT_FOUND問題を完全に解決するため、革新的なIPC-basedスクリプト読み込みシステムを実装：

- **動的IPCローディング**: ファイルパスではなくIPCチャンネル経由でスクリプト内容を取得
- **ASAR対応**: パッケージング後もアーカイブ内リソースに正確にアクセス
- **依存関係管理**: BaseManagerを最初に読み込み、依存エラーを防止
- **フォールバック機能**: 複数のパス候補で確実なリソース発見
- **型安全な通信**: TypeScriptインターフェースによる厳密なIPC型定義

#### 各マネージャーの責任

**🏛️ BaseManager**
- 共通のエラーハンドリング・ログシステム
- TypeScript型安全な基底インターフェース
- イベントリスナー管理
- ユーティリティ関数（debounce, throttle等）

**🧮 AlgorithmManager**
- 三分探索・Natural PSAアルゴリズムの実装
- 型安全なアルゴリズム状態管理
- メインプロセスとの同期
- アルゴリズム表示の更新

**🎨 UIManager**
- フェーズ遷移管理（setup → adjustment → complete）
- テーマ切り替え・レスポンシブデザイン
- 要素の表示/非表示制御
- アニメーション管理

**✅ ValidationManager**
- リアルタイム入力検証
- 型安全なカスタムバリデーター
- エラーメッセージ表示
- フォームバリデーション

**📢 NotificationManager**
- 通知の表示・管理・キューイング
- 自動非表示タイマー
- アクセシビリティ対応
- 型安全な通知インターフェース

**♿ AccessibilityManager**
- キーボードナビゲーション
- スクリーンリーダー対応
- ARIA属性管理
- フォーカス管理

**⚡ PerformanceManager**
- リアルタイムパフォーマンス監視
- メモリ使用量トラッキング
- CPU使用率監視
- デバッグ情報収集

**🏗️ ServiceContainer**
- 依存性注入パターン実装
- マネージャー間の疎結合
- ライフサイクル管理
- 型安全なサービス解決

#### 設計パターン

- **Manager Pattern**: 各機能を独立したマネージャーで管理
- **Dependency Injection**: ServiceContainerによる型安全な依存性注入
- **Event-Driven Architecture**: イベントベースの疎結合設計
- **Error Boundary**: 階層化されたエラーハンドリング
- **Single Responsibility**: 各クラスが単一の責任を持つ設計
- **Type-Safe IPC**: TypeScriptインターフェースによる型安全なIPC通信
- **ビルドツール**: Electron Forge
- **自動アップデート**: update-electron-app + GitHub Releases
- **アクセシビリティ**: ARIA attributes, keyboard navigation support

## 📁 プロジェクト構造

```
valorant-mouse-sensitivity-utility/
├── main.js                    # Electronメインプロセス（IPC対応、設定管理）
├── preload.js                 # プリロードスクリプト（IPC-based loading）
├── index.html                 # メインHTML（IPC-only loading、アクセシビリティ）
├── styles/
│   └── main.css               # メインスタイルシート（flexbox layout、テーマサポート）
├── scripts/
│   ├── managers/              # TypeScript マネージャークラス群
│   │   ├── BaseManager.ts            # 基底クラス・型定義
│   │   ├── AlgorithmManager.ts       # アルゴリズム管理
│   │   ├── UIManager.ts              # UI状態管理
│   │   ├── ValidationManager.ts      # 入力検証
│   │   ├── NotificationManager.ts    # 通知システム
│   │   ├── AccessibilityManager.ts   # アクセシビリティ
│   │   ├── PerformanceManager.ts     # パフォーマンス監視
│   │   └── ServiceContainer.ts       # 依存性注入
│   ├── app.ts                 # メインアプリケーション（TypeScript）
│   ├── config.ts              # 設定管理（型安全）
│   ├── i18n.ts                # 国際化システム（TypeScript）
│   ├── accessibility.ts       # アクセシビリティ初期化
│   └── performance.ts         # パフォーマンス初期化
├── dist/                      # TypeScriptコンパイル結果
│   └── scripts/               # .jsファイル（実際に実行される）
├── types/
│   └── index.ts               # TypeScript型定義
├── docs/                      # ドキュメント
├── tsconfig.json              # TypeScript設定
├── package.json               # プロジェクト設定（v1.4.0）
├── forge.config.js            # Electron Forge設定（ASAR対応）
└── README.md                  # このファイル
```

## 🎨 機能詳細

### 多言語サポート
- **完全な日本語対応**: UI、メニュー、メッセージ
- **English support**: Full localization
- **設定の永続化**: 言語設定は自動保存・復元
- **リアルタイム切り替え**: アプリ再起動不要

### テーマシステム
アプリケーションには2つのテーマが用意されています：

- **ライトモード**: 明るい背景で日中の使用に最適
- **ダークモード**: 暗い背景で目に優しく、長時間の使用に適している

テーマ設定はローカルストレージに自動保存され、次回起動時に復元されます。

### アクセシビリティ機能
- **キーボードナビゲーション**: 全機能をキーボードで操作可能
- **スクリーンリーダー対応**: ARIA属性による支援技術サポート
- **フォーカス管理**: 明確なフォーカスインジケーター
- **ハイコントラスト対応**: 視認性を重視したカラーパレット

### パフォーマンス最適化
- **条件付き監視**: 開発環境でのみデバッグ機能を有効化
- **メモリ効率**: 効率的なキャッシュとガベージコレクション
- **CPU最適化**: 不要な処理の削減とリソース管理
- **レスポンシブUI**: スムーズな操作感とリアルタイム更新

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更を行う場合は、まずIssueを作成して変更内容について議論してください。

### 開発環境のセットアップ

#### 必要な環境
- Node.js (v16+)
- npm または yarn
- TypeScript 5.9.2+

#### セットアップ手順
```bash
# リポジトリのクローン
git clone https://github.com/saica1101/valorant-mouse-sensitivity-utility.git
cd valorant-mouse-sensitivity-utility

# 依存関係のインストール
npm install

# TypeScriptファイルのコンパイル
npm run build:ts

# 開発モードで起動
npm run dev

# TypeScript型チェック
npm run type-check

# TypeScript監視モード（自動コンパイル）
npm run build:watch
```

#### 開発ワークフロー
1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. TypeScriptファイルを編集（`.ts`ファイル）
4. `npm run build:ts`でコンパイル
5. 変更をコミット (`git commit -m 'Add some amazing feature'`)
6. ブランチにプッシュ (`git push origin feature/amazing-feature`)
7. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは[ISC License](LICENSE)の下で公開されています。

## 🔗 関連リンク

- [Valorant公式サイト](https://playvalorant.com/)
- [Electron公式ドキュメント](https://www.electronjs.org/docs)
- [リリースページ](https://github.com/saica1101/valorant-mouse-sensitivity-utility/releases)

## 📞 サポート

問題が発生した場合や質問がある場合は、[Issues](https://github.com/saica1101/valorant-mouse-sensitivity-utility/issues)を作成してください。

## 📊 更新履歴

### v1.4.1 (Latest) - 2025年8月
- 🔧 **完全TypeScript移行**: JavaScript → TypeScript 5.9.2
- 🛡️ **型安全性の向上**: 包括的な型定義とインターフェース
- 🏗️ **アーキテクチャ強化**: モジュラー設計 + 型安全性
- 🔄 **IPC-based Script Loading**: ERR_FILE_NOT_FOUND完全解決
- 📦 **ASAR対応**: パッケージング時のリソースアクセス改善
- ⚡ **開発体験向上**: IDE補完、静的解析、リファクタリング安全性
- 📁 **ビルドシステム**: TypeScript自動コンパイル対応
- 🎯 **UI改善**: ボタン位置調整、flexboxレイアウト
- 🛠️ **依存関係管理**: BaseManager優先読み込み、ReferenceError解決
- 📚 **ドキュメント強化**: 技術仕様、アーキテクチャ説明更新

### v1.4.0
- ✨ Natural PSAアルゴリズムの追加
- 🌐 完全な多言語対応（日本語・英語）
- 💾 設定の永続化（言語・アルゴリズム・テーマ）
- ♿ アクセシビリティ機能の強化
- 🚀 パフォーマンス最適化
- 🎯 メニューシステムの実装

---

**Made with ❤️ for Valorant players**

> **Note**: このツールはValorant公式ツールではありません。コミュニティによって作成された非公式のユーティリティです。

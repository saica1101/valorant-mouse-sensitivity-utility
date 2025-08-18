# 🎯 Valorant Mouse Sensitivity Utility

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Electron](https://img.shields.io/badge/Electron-37.3.0-47848F?logo=electron)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/electron/electron)

Valorantプレイヤー向けの最適なマウス感度を見つけるためのElectronアプリケーションです。三分探索アルゴリズムを使用して、効率的にあなたにぴったりの感度設定を発見できます。

## 📸 スクリーンショット
> NOTE: 画像は開発中の物であり実際の物とは異なる場合があります。

### ライトモード
![Light Mode Screenshot](./screenshots/app-light-mode.png)

### ダークモード  
![Dark Mode Screenshot](./screenshots/app-dark-mode.png)

### 使用デモ
![Demo GIF](./screenshots/app-demo.gif)

## ✨ 機能

- 🔍 **効率的な感度探索**: 三分探索アルゴリズムによる最適化された感度調整
- 🖱️ **DPI対応**: 400, 800, 1600, 3200の一般的なDPI値 + カスタム入力
- 🌙 **テーマ切り替え**: ライトモード・ダークモード対応
- 💾 **設定保存**: テーマ設定の自動保存
- 🎮 **Valorant特化**: ゲーム向けに最適化された感度計算
- 🔄 **自動アップデート**: GitHubリリースからの自動更新機能

## 🚀 クイックスタート

### ダウンロード
[クライアントのダウンロード](https://github.com/saica1101/valorant-mouse-sensitivity-utility/releases)

## 🎯 使用方法

### Step 1: DPI設定
- マウスのDPI値を入力するか、プリセット値（400, 800, 1600, 3200）から選択
- 「感度調整を開始」をクリック

### Step 2: 感度調整（三分探索）
1. 2つの候補感度値（候補A、候補B）が表示されます
2. 各感度値をValorantで試して比較
3. より快適だと感じる方を選択:
   - 👈 **Aが快適**: 候補Aの方が好ましい場合
   - 👉 **Bが快適**: 候補Bの方が好ましい場合
   - 🟰 **どちらも同じ**: 両方とも同程度に快適な場合
4. 選択に基づいて次の候補が表示されます

### Step 3: 完了
- 最適な感度が見つかると「Finish」メッセージが表示
- 「Reset」ボタンで新しい調整を開始可能

### 自動アップデート機能
- アプリ起動時と10分間隔で自動的に新しいバージョンをチェック
- 新しいバージョンが利用可能な場合、バックグラウンドで自動ダウンロード
- ダウンロード完了時にユーザーに通知し、再起動確認ダイアログを表示
- ユーザーの承認後、アプリが自動再起動してアップデートが適用

## ⚙️ 技術仕様

### アルゴリズム（三分探索）
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

### 技術スタック
- **フレームワーク**: Electron
- **言語**: JavaScript (ES6+)
- **UI**: HTML5, CSS3 (CSS Variables for theming)
- **ビルドツール**: Electron Forge
- **自動アップデート**: update-electron-app + GitHub Releases

## 📁 プロジェクト構造

```
valorant-mouse-sensitivity-utility/
├── src/
│   ├── main.js          # メインプロセス
│   ├── preload.js       # プリロードスクリプト
│   └── index.html       # レンダラープロセス
├── package.json         # プロジェクト設定
├── README.md           # このファイル
└── forge.config.js     # Electron Forge設定
```

## 🎨 テーマ

アプリケーションには2つのテーマが用意されています：

- **ライトモード**: 明るい背景で日中の使用に最適
- **ダークモード**: 暗い背景で目に優しく、長時間の使用に適している

テーマ設定はローカルストレージに自動保存され、次回起動時に復元されます。

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更を行う場合は、まずIssueを作成して変更内容について議論してください。

### 開発環境のセットアップ
1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは[ISC License](LICENSE)の下で公開されています。

## 🔗 関連リンク

- [Valorant公式サイト](https://playvalorant.com/)
- [Electron公式ドキュメント](https://www.electronjs.org/docs)
## 📞 サポート

問題が発生した場合や質問がある場合は、[Issues](https://github.com/yourusername/valorant-mouse-sensitivity-utility/issues)を作成してください。

---

**Made with ❤️ for Valorant players**

> **Note**: このツールはValorant公式ツールではありません。コミュニティによって作成された非公式のユーティリティです。

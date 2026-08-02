# I&D Hub – 用戶說明書（中文版）

**版本：** v2.0  
**最後更新：** 2026 年 8 月

---

## 目錄

1. [系統簡介](#1-系統簡介)
2. [角色權限對照表](#2-角色權限對照表)
3. [登入及帳戶管理](#3-登入及帳戶管理)
4. [Superadmin 使用手冊](#4-superadmin-使用手冊)
5. [Admin 使用手冊](#5-admin-使用手冊)
6. [Project User 使用手冊](#6-project-user-使用手冊)
7. [Guest 使用手冊](#7-guest-使用手冊)
8. [常見問題及排除](#8-常見問題及排除)
9. [技術支援](#9-技術支援)

---

## 1. 系統簡介

I&D Hub 係**創新及發展項目管理系統**，提供一站式平台：提交/審批創新意念、管理項目生命周期（規劃→進行中→已完成）、AI 輔助意念評估、資助計劃管理、報表匯出。

### 網址
> **https://frontend-alpha-bay-74.vercel.app/**

### 角色類型

| 角色 | 說明 |
|---|---|
| **Superadmin（超級管理員）** | 系統全部權限（審批、AI、設定、用戶管理） |
| **Admin（管理員）** | 項目管理 + AI 分析（冇審批權、冇設定權） |
| **Project User（項目用戶）** | 只可以查看及更新自己嘅項目 |
| **Guest（訪客）** | 瀏覽公開項目、提交意念、查看資助計劃 |

---

## 2. 角色權限對照表

| 功能 | Superadmin | Admin | Project User | Guest |
|---|---|---|---|---|
| Dashboard（總覽） | ✅ | ✅ | ❌ | ❌ |
| All Projects（瀏覽全部項目） | ✅ | ✅ | ❌ | ✅ |
| My Projects（管理自己項目） | ✅ | ✅ | ❌ | ❌ |
| Pending Approval（審批頁） | ✅ | ✅（只可查看） | ❌ | ❌ |
| – 審批/拒絕意念 | ✅ | ❌ | ❌ | ❌ |
| – AI Analyze（執行分析） | ✅ | ✅ | ❌ | ❌ |
| – AI Report（查看報告） | ✅ | ✅ | ❌ | ❌ |
| – Re-Analyze（重新分析） | ✅ | ❌ | ❌ | ❌ |
| – 軟刪除/恢復/永久刪除 | ✅ | ❌ | ❌ | ❌ |
| Approved Projects（已批准項目） | ✅ | ✅ | ❌ | ❌ |
| Submit Idea（提交意念） | ✅ | ✅ | ❌ | ✅ |
| Funding Schemes（瀏覽資助計劃） | ✅ | ✅ | ❌ | ✅ |
| – 新增/編輯/刪除計劃 | ✅ | ❌ | ❌ | ❌ |
| Settings（系統設定） | ✅ | ❌ | ❌ | ❌ |
| Alerts（警報） | ✅ | ✅ | ❌ | ❌ |
| Report Export（Excel 匯出） | ✅ | ❌ | ❌ | ❌ |
| My Project（自己項目） | ❌ | ❌ | ✅ | ❌ |
| 更改密碼 | ✅ | ✅ | ❌ | ❌ |
| 忘記密碼（重設連結） | ✅ | ✅ | ❌ | ❌ |

---

## 3. 登入及帳戶管理

### 3.1 Admin / Superadmin 登入
1. 打開應用程式網址。
2. 撳 **Admin Login** 分頁。
3. 輸入**登入電郵**同**密碼**。
4. 撳 **Login**。👁️ 圖示可顯示/隱藏密碼。

### 3.2 Project User 登入
1. 撳 **Project Login** 分頁。
2. 輸入 **Project ID** 同**密碼**（由系統管理員提供）。
3. 撳 **Login to Project**。

### 3.3 Guest 訪客進入
1. 撳 Admin 登入表單下面嘅 **Guest** 按鈕。

### 3.4 忘記密碼
1. 撳 **Forgot Password?** → 輸入電郵 → 撳 **Send Reset Link**。
2. 檢查收件箱，撳郵件內連結按指示重設密碼。

### 3.5 更改密碼
1. 撳 **Change Password**。
2. 輸入：登入電郵、現時密碼、新密碼（最少 6 字元）、確認新密碼。
3. 撳 **Change Password**，成功後返回登入畫面。

---

## 4. Superadmin 使用手冊

### 4.1 Dashboard（總覽）
- **6 個 KPI 卡：** 全部項目、進行中、規劃中、已完成、即將到期、有風險。
- **健康分佈圖：** 圓環圖（已完成/健康/警告/嚴重，顏色可喺 Settings 改）。
- **即將到期/逾期：** 最多 6 個項目（紅=逾期、橙=≤14日、綠=正常）。
- **最新意念：** 最新 4 個，撳 View All 展開。

### 4.2 All Projects（全部項目）
- 卡片顯示項目 ID、狀態、健康、名稱、描述、負責人。
- 撳卡片開啟完整詳情頁。

### 4.3 My Projects（我的項目）
- 狀態分頁篩選 / 排序 / **+ Add Project** 手動建立 / Edit 修改 / View 詳情。
- 手動建立表單：基本資料（名稱、描述、狀態、日期、預算、經理、持有人）、背景（痛點、效益、交付）、階段（新增/編輯/刪除）。
- *審批意念時系統自動建立項目，通常唔需手動建立。*

### 4.4 Pending Approval（審批頁，核心流程）
意念分 4 區塊：**Pending Review / Approved / Rejected / Deleted**。

- **View Details**：查看完整意念。
- **🤖 AI Analyze**：對未有報告嘅意念執行 AI 分析。
  - 供應商：OpenAI / Custom（OpenAI 兼容）/ Cloudflare AI。
  - Cloudflare 預設 Model：`@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`。
  - 結果：7 維評分卡 + 總分 + 建議 + **完整報告**（按 Settings → AI Report Prompt）+ *For reference only.*
  - **📄 Export Word**：下載 Word 報告。
- 已有報告時：**📊 AI Report**（查看）/ **📄 Export Word** / **🔄 Re-Analyze**（重新生成，只限 Superadmin）。

**審批流程：**
1. **Approve** → 確認 → 意念標記已批准 + 自動建立項目（ID 格式 `IDNDYYMMNNN`，如 `IDND2608001`）。
2. **Reject** → 輸入原因（必填）→ 移到 Rejected。
3. **🗑️ 軟刪除** → 移到 Deleted。
4. **Restore** → 由 Deleted 返回 Pending。
5. **Permanently Delete** → ⚠️ 永久刪除，無法復原。

### 4.5 Approved Projects（已批准項目）
- 顯示已批准意念 + 關聯項目、統計卡、Delete Project。

### 4.6 Submit Idea（提交意念）
**8 步精靈：**
1. 申請人資料（申請人/項目經理/擁有人/技術支援 × 姓名、部門、聯絡、電郵）
2. 項目詳情（標題、類型、背景、痛點、替代方案、範圍、交付、效益、階段、風險）
3. 時間及終止（開始/完成日期、3 個終止條件）
4. 預算及資金（總預算、來源、細分、目標政府資助）
5. 資源及支援（資源需求、跨部門協助）
6. 技術及創新（技術方向、創新元素、技術要求）
7. 現時階段（類型、日期、狀態）
8. 知識產權及附件（IP、地區、備註）
撳 Next/Previous 移動，最後 Submit。

### 4.7 Funding Schemes（資助計劃）
- 搜尋欄過濾 / 卡片顯示（名稱、狀態、提供者、金額、資格、截止日）。
- **+ Add Scheme**：名稱*、提供者*、金額、描述、資格、截止日、狀態。
- **Edit / Delete**：修改/刪除（需確認）。

### 4.8 Settings（系統設定，只限 Superadmin）
- **逾期設定：** 警告日數 / 嚴重日數。
- **預算設定：** 警告% / 嚴重%。
- **電郵通知：** 啟用、收件人、逾期/超支發送、頻率。
- **警報顏色：** 嚴重/警告/正常/已完成。
- **AI 報告提示詞：** 編輯 AI 分析用嘅 prompt（評估詳情會自動附加）。
- **備份及恢復：** 💾 完整備份 / 📥 恢復備份（會覆蓋現有資料）。
- **項目憑證：** Generate（生成密碼）/ Save / Copy。

### 4.9 Alerts（警報）
- 嚴重（紅）：逾期、冇預算、超支。
- 警告（黃）：14 日內到期、預算近上限。
- 資訊（藍）：一般更新。撳卡片跳轉項目。

### 4.10 Report Export（報表匯出）
- 匯出項目（12 欄）/ 意念（11 欄）/ 資助計劃（8 欄）/ 全部（3 sheets）。
- *目前用示範數據集。*

---

## 5. Admin 使用手冊

### 5.1-5.3 Dashboard / All Projects / My Projects
同 Superadmin 一樣。

### 5.4 Pending Approval（Admin 視角）
**可用：** 🤖 AI Analyze、📊 AI Report、📄 Export Word。
**唔可用：** ❌ 審批/拒絕、❌ Re-Analyze、❌ 刪除/恢復。

### 5.5 其他頁面
同 Superadmin 一樣，**除咗** Funding Schemes 只可瀏覽。

### 5.6 帳戶
更改密碼 / 忘記密碼（見第 3 節）。

---

## 6. Project User 使用手冊

### 6.1 登入
Project Login 分頁 → Project ID + 密碼。

### 6.2 My Project 頁面
- 項目總覽（ID、名稱、狀態、健康、經理/持有人、預算）。
- 詳細區塊（背景、痛點、效益、里程碑、預算使用、階段進度、活動記錄）。
- **Edit** → 更新基本欄位（名稱、描述、狀態、日期、預算、經理、持有人、背景、痛點、效益、交付）→ **Save**（記錄喺活動記錄）。

### 6.3 未分配項目
顯示 "No project found for your account." — 聯絡技術支援。

---

## 7. Guest 使用手冊

### 7.1 進入
登入頁撳 **Guest** 按鈕。

### 7.2 可用功能
- **All Projects**：瀏覽所有項目。
- **Submit Idea**：完整 8 步提交意念。
- **Funding Schemes**：瀏覽資助計劃。

### 7.3 唔可用
Dashboard / My Projects / Pending Approval / Settings / Alerts / Report Export。

---

## 8. 常見問題及排除

**Q1 唔記得密碼：** Admin Login → Forgot Password? → 輸入電郵 → 按郵件連結重設。

**Q2 更改密碼：** Admin Login → Change Password → 輸入資料。

**Q3 AI 失敗 "Failed to fetch"：** 檢查網絡 / 自訂端點（如 Ollama）有冇啟動 / 本機後端（port 5000）有冇啟動 / 換供應商。

**Q4 AI 格式無效：** 再 Run Analysis 或改用 DeepSeek 模型（推薦預設）。

**Q5 Admin 可以審批？** 唔可以，只有 Superadmin 先可以。

**Q6 Guest 提交意念？** 可以，撳 Submit Idea。

**Q7 冇完整報告：** AI 要輸出 `report` 欄位，試 DeepSeek 或 Re-Analyze。

**Q8 彈窗撳外面會關？** 唔會，只可透過 ✕ 或 Cancel 關閉。

**Q9 之後再匯出 Word？** 任何時間開 AI Report → Export Word。

**Q10 網址難記：** Vercel Dashboard → Settings → Project Name 改短名 或加自訂網域。

---

## 9. 技術支援

如有任何問題、疑問，或需要 Project ID / 密碼，請聯絡：

**Don Kwan**  
📧 **don.kwan@asiaalliedgroup.com**  
📞 **3798 5724**

*聯絡時請提供：角色、使用中頁面/功能、問題描述（可附截圖）、發生日期/時間。*

---

*© Asia Allied Group – I&D Hub v2.0*
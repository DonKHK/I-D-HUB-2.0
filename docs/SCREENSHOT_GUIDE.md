# I&D Hub – Screenshot Guide

*This guide tells you which screenshots to take for the user manuals and where to place them.*

| # | Screen / Page | Role to log in as | File Name | Folder |
|---|---|---|---|---|
| 1 | **Login page** | – | `01-login.png` | `docs/screenshots/` |
| 2 | **Admin Login form + Forgot/Change Password buttons** | – | `02-login-admin.png` | `docs/screenshots/` |
| 3 | **Project Login tab** | – | `03-login-project.png` | `docs/screenshots/` |
| 4 | **Forgot Password form** | – | `04-forgot-password.png` | `docs/screenshots/` |
| 5 | **Change Password form** | – | `05-change-password.png` | `docs/screenshots/` |
| 6 | **Dashboard (KPI cards + chart)** | Superadmin | `06-dashboard.png` | `docs/screenshots/` |
| 7 | **All Projects** | Superadmin | `07-all-projects.png` | `docs/screenshots/` |
| 8 | **My Projects** | Superadmin | `08-my-projects.png` | `docs/screenshots/` |
| 9 | **Pending Approval (all 4 sections)** | Superadmin | `09-pending-approval.png` | `docs/screenshots/` |
| 10 | **AI Analysis modal (provider selection)** | Superadmin | `10-ai-analysis-modal.png` | `docs/screenshots/` |
| 11 | **AI Result modal (scorecard + full report)** | Superadmin | `11-ai-result-modal.png` | `docs/screenshots/` |
| 12 | **Approved Projects** | Superadmin | `12-approved-projects.png` | `docs/screenshots/` |
| 13 | **Submit Idea – wizard step 1 (Applicant Info)** | Superadmin | `13-idea-wizard-1.png` | `docs/screenshots/` |
| 14 | **Submit Idea – wizard step 2 (Project Details)** | Superadmin | `14-idea-wizard-2.png` | `docs/screenshots/` |
| 15 | **Submit Idea – wizard step 8 (IP & Attachments)** | Superadmin | `15-idea-wizard-8.png` | `docs/screenshots/` |
| 16 | **Funding Schemes** | Superadmin | `16-funding-schemes.png` | `docs/screenshots/` |
| 17 | **Add Scheme modal** | Superadmin | `17-add-scheme.png` | `docs/screenshots/` |
| 18 | **Settings – top (Overdue + Budget)** | Superadmin | `18-settings-top.png` | `docs/screenshots/` |
| 19 | **Settings – AI Report Prompt** | Superadmin | `19-settings-ai-prompt.png` | `docs/screenshots/` |
| 20 | **Settings – Backup & Restore** | Superadmin | `20-settings-backup.png` | `docs/screenshots/` |
| 21 | **Settings – Project Credentials** | Superadmin | `21-settings-credentials.png` | `docs/screenshots/` |
| 22 | **Alerts** | Superadmin | `22-alerts.png` | `docs/screenshots/` |
| 23 | **Report Export** | Superadmin | `23-report-export.png` | `docs/screenshots/` |
| 24 | **My Project (Project User view)** | Project User | `24-my-project.png` | `docs/screenshots/` |
| 25 | **Guest – All Projects** | Guest | `25-guest-all-projects.png` | `docs/screenshots/` |
| 26 | **Guest – Submit Idea** | Guest | `26-guest-submit-idea.png` | `docs/screenshots/` |

## How to take a screenshot (Windows)

1. Open the app in your browser.
2. **Win + Shift + S** → select the area → the image is copied to the clipboard.
3. Open **Paint** (or any image editor) → **Ctrl + V** → **Save As → PNG**.
4. Name the file as shown in the table above and save to `docs/screenshots/`.

## How to insert screenshots into the manuals

In `docs/USER_MANUAL_EN.md` and `docs/USER_MANUAL_ZH.md`, the placeholders look like this:

```
![SCREENSHOT: Pending Approval page]
```

Replace them with the actual image reference:

```
![Pending Approval](screenshots/09-pending-approval.png)
```

Then rebuild the Word versions (regenerate the .doc files) so the images are embedded.
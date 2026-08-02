# I&D Hub – User Manual (English)

**Version:** v2.0  
**Last Updated:** August 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Role Permission Matrix](#2-role-permission-matrix)
3. [Login & Account Management](#3-login--account-management)
4. [Superadmin Manual](#4-superadmin-manual)
5. [Admin Manual](#5-admin-manual)
6. [Project User Manual](#6-project-user-manual)
7. [Guest Manual](#7-guest-manual)
8. [Troubleshooting & FAQ](#8-troubleshooting--faq)
9. [Support](#9-support)

---

## 1. Overview

I&D Hub is the **Innovation & Development Project Management System** of Asia Allied Group. It provides a centralised platform for:

- Submitting and reviewing innovation ideas
- Managing projects through their full lifecycle (Planning → In Progress → Completed)
- AI-assisted idea evaluation and scoring
- Funding scheme management
- Reporting and data export

### Access URL

Open your web browser and go to:

> **https://frontend-alpha-bay-74.vercel.app/**

*Recommended browsers: Chrome, Edge, Safari (latest versions).*

### Role Types

| Role | Description |
|---|---|
| **Superadmin** | Full system access: manage everything, approve/reject ideas, AI analysis, system settings, all users |
| **Admin** | System access for project management and AI analysis (view/analyse, no approvals, no settings) |
| **Project User** | View and update only their own assigned project |
| **Guest** | Browse public projects, submit ideas, view funding schemes (no login required) |

---

## 2. Role Permission Matrix

| Function / Feature | Superadmin | Admin | Project User | Guest |
|---|---|---|---|---|
| **Dashboard** (KPI overview) | ✅ | ✅ | ❌ | ❌ |
| **All Projects** (browse) | ✅ | ✅ | ❌ | ✅ |
| **My Projects** (manage own) | ✅ | ✅ | ❌ | ❌ |
| **Pending Approval** | ✅ | ✅ (view ideas) | ❌ | ❌ |
| &nbsp;&nbsp;– Approve / Reject Idea | ✅ | ❌ | ❌ | ❌ |
| &nbsp;&nbsp;– AI Analyze (run) | ✅ | ✅ | ❌ | ❌ |
| &nbsp;&nbsp;– AI Report (view) | ✅ | ✅ | ❌ | ❌ |
| &nbsp;&nbsp;– Re-Analyze (regenerate) | ✅ | ❌ | ❌ | ❌ |
| &nbsp;&nbsp;– Soft Delete / Restore / Permanent Delete | ✅ | ❌ | ❌ | ❌ |
| **Approved Projects** | ✅ | ✅ | ❌ | ❌ |
| **Submit Idea** | ✅ | ✅ | ❌ | ✅ |
| **Funding Schemes** (browse) | ✅ | ✅ | ❌ | ✅ |
| &nbsp;&nbsp;– Add / Edit / Delete Scheme | ✅ | ❌ | ❌ | ❌ |
| **Settings** (system-wide) | ✅ | ❌ | ❌ | ❌ |
| **Alerts** | ✅ | ✅ | ❌ | ❌ |
| **Report Export** (Excel) | ✅ | ❌ | ❌ | ❌ |
| **My Project** (own project only) | ❌ | ❌ | ✅ | ❌ |
| **Change Password** | ✅ | ✅ | ❌ | ❌ |
| **Forgot Password (reset link)** | ✅ | ✅ | ❌ | ❌ |

---

## 3. Login & Account Management

### 3.1 Admin / Superadmin Login

1. Open the app URL.
2. Click the **Admin Login** tab.
3. Enter your **Login Email** and **Password**.
4. Click **Login**.
5. Click the 👁️ icon next to the password field to show/hide the password.

### 3.2 Project User Login

1. Open the app URL.
2. Click the **Project Login** tab.
3. Enter your **Project ID** and **Password**.
4. Click **Login to Project**.
   - *Project ID and password are provided by the system administrator.*

### 3.3 Guest Access

1. Open the app URL.
2. Click the **Guest** button (located below the Admin login form).
3. You will be redirected into the system with guest-level access.

### 3.4 Forgot Password

1. On the Admin Login tab, click **Forgot Password?**.
2. Enter your **Login Email**.
3. Click **Send Reset Link**.
4. Check your email inbox — you will receive a password-reset email from Firebase.
5. Click the link in the email and follow the instructions to set a new password.

### 3.5 Change Password

1. On the Admin Login tab, click **Change Password**.
2. Enter:
   - **Login Email**
   - **Current Password**
   - **New Password** (minimum 6 characters)
   - **Confirm New Password**
3. Click **Change Password**.
4. On success, a confirmation message is shown and you will return to the login screen.

---

## 4. Superadmin Manual

*The Superadmin has full control over the entire system.*

### 4.1 Dashboard

The first screen after login.

- **6 KPI cards:** Total Projects, In Progress, Planning, Completed, Due Soon, At Risk.
- **Project Health Distribution:** doughnut chart showing Completed / Healthy / Warning / Critical counts (colours configurable in Settings).
- **Upcoming / Overdue Projects:** list of the next 6 projects sorted by deadline, with red (overdue), orange (≤14 days) and green (on track) indicators.
- **Recent Ideas:** latest submitted ideas (4 visible; click **View All** to expand).

### 4.2 All Projects

Browse every project in the system.

- Cards show: project ID, status badge, health dot, name, description, owner, and key details.
- Click any card to open the full **Project Detail** page.

### 4.3 My Projects

Projects you are involved with.

- Filter by status tabs (e.g. All / Planning / In Progress / Completed).
- Sort by name or status using the sort dropdown.
- Click **+ Add Project** to create a new project manually (full form with sections).
- Click **Edit** to modify a project; click **View** to open the detail page.

**To create/edit a project manually** (Project Form):

- **Basic Info:** Name, Description, Detail Content, Status, Start Date, End Date, Budget, Budget Used, Manager, Holder.
- **Background:** background, pain points, benefits, deliverables, project phases.
- **Stages:** add/edit/delete project stages (type, description, dates, budget, status).
- Approving an idea automatically generates the project — you usually do **not** need to create one manually.

### 4.4 Pending Approval (Core Workflow)

This is the central idea-review page. Ideas are grouped into 4 sections:

- **Pending Review** (new ideas awaiting decision)
- **Approved** (approved — linked project shown if created)
- **Rejected**
- **Deleted**

![SCREENSHOT: Pending Approval page]

#### 4.4.1 Review an Idea

- Click **View Details** to see the complete idea submission.
- Cards show: idea ID, title, applicant, submission date, health status.

#### 4.4.2 AI Analysis

For **Pending** ideas (no report yet), click **🤖 AI Analyze**.

![SCREENSHOT: AI Analysis modal - provider selection]

In the modal:

1. **AI Provider** — select one of:
   - **OpenAI** (enter API Key, Model e.g. gpt-3.5-turbo)
   - **Custom (OpenAI-compatible)** (enter API Key + Endpoint URL + Model — e.g. local Ollama)
   - **Cloudflare AI** (enter Account ID + API Token + Model — default `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`)
2. Click **Run Analysis**.

After analysis, the **AI Analysis Result** modal shows:

- **Scorecard** — 7 scored dimensions (Creativity, Market Demand, Existing Solutions, Budget Feasibility, Timeline Feasibility, Scope Clarity, Risk Level) each with a 1–10 score bar and comment.
- **Overall Score** (1–10) with recommendation (Approve / Conditional / Reject).
- **Full Report** — the complete written report generated according to the prompt configured in **Settings → AI Report Prompt**.
- A disclaimer *"For reference only."* appears at the bottom.

Buttons in the result modal:

- **📄 Export Word** — downloads a Word-compatible `.doc` report containing the scorecard, full report, and *"For reference only."*

**If the idea already has a report:**

- **📊 AI Report** — opens the saved report (scorecard + full text) at any time.
- **📄 Export Word** — export the saved report to Word again.
- **🔄 Re-Analyze** *(Superadmin only)* — re-run AI analysis to generate a brand-new report and overwrite the old one.

![SCREENSHOT: AI Result modal with scorecard and full report]

#### 4.4.3 Approve an Idea

1. Click **Approve** on the idea card.
2. Confirm in the dialog.
3. The system automatically:
   - Marks the idea as **Approved**.
   - Creates a new project (ID format `IDNDYYMMNNN`, e.g. `IDND2608001`) from the idea data.
4. The idea moves to the **Approved** section, showing the linked project ID.

#### 4.4.4 Reject an Idea

1. Click **Reject**.
2. Enter a **Reason for rejection** (required).
3. Click **Reject**.
4. The idea moves to the **Rejected** section with the reason displayed.

#### 4.4.5 Soft Delete (Move to Trash)

1. Click the 🗑️ button.
2. Confirm **Move to Trash**.
3. The idea moves to the **Deleted** section.

#### 4.4.6 Restore a Deleted Idea

1. In the **Deleted** section, click **Restore**.
2. The idea returns to **Pending Review**.

#### 4.4.7 Permanently Delete

1. In the **Deleted** section, click **Permanently Delete**.
2. ⚠️ Warning — this cannot be undone.
3. Confirm to permanently remove the idea record.

### 4.5 Approved Projects

Shows all approved ideas and their linked projects.

- Statistical summary cards at the top.
- Each item shows the approved idea and the project generated from it.
- **Delete Project** removes the linked project (and optionally the idea).

### 4.6 Submit Idea

Submit a new innovation idea through the **8-step wizard**:

1. **Applicant Info** — Applicant / Project Manager / Owner / Technical Support details (name, department, contact, email for each).
2. **Project Details** — Title, Project Type, Background, Pain Points, Current Workarounds, Scope, Deliverables, Benefits, Phases, Risks.
3. **Timeline & Termination** — Expected Start Date, Target Completion Date, 3 Termination Conditions.
4. **Budget & Funding** — Total Budget, Funding Source, Budget Breakdown, Target Government Fund + Details.
5. **Resources & Support** — Resource Requirements, Cross-Department Assistance.
6. **Technical & Innovation** — Tech Direction, Innovation Element, Technical Requirements.
7. **Current Stage** — Stage Type, Stage Dates, Stage Status.
8. **IP & Attachments** — IP requirement, region, attachment notes.

Click **Next / Previous** to move between steps, then **Submit**.

### 4.7 Funding Schemes

Manage funding/subsidy schemes.

- **Search bar** filters by scheme name or provider.
- Cards show: name, status badge (Open/Closed/Pending), provider, description, total amount (HKD), eligibility, deadline.
- **+ Add Scheme** — opens a form to create a new scheme:
  - Scheme Name*, Provider*, Total Amount (HKD), Description, Eligibility Criteria, Deadline, Status (Open/Closed/Pending).
- **Edit** / **Delete** — modify or remove an existing scheme (with confirmation).

### 4.8 Settings (System Configuration)

*Superadmin only.*

#### 4.8.1 Overdue Thresholds

- **Overdue Warning (days):** how many days before the deadline a yellow warning appears.
- **Overdue Critical (days):** how many days past the deadline before a red critical alert appears.

#### 4.8.2 Budget Thresholds

- **Budget Warning (%):** at what % of budget usage a yellow warning appears.
- **Budget Critical (%):** at what % of budget usage a red critical alert appears.

#### 4.8.3 Email Notifications

- Enable/disable email alerts.
- When enabled: set recipients (comma-separated), send when overdue, send when budget exceeded, and frequency (Immediate / Daily / Weekly).

#### 4.8.4 Alert Colors

Customise colours for: **Critical**, **Warning**, **On Track**, **Completed**.

#### 4.8.5 AI Report Prompt

Edit the prompt used by the AI analysis. The idea details and a JSON scorecard output requirement are automatically appended. *(Default prompt produces a professional Committee-ready report: Executive Summary, Scorecard, Detailed Analysis, AI Recommendations, Appendices.)*

#### 4.8.6 Backup & Restore

- **💾 Full System Backup** — downloads a JSON backup containing all projects, ideas and settings.
- **📥 Restore Backup** — upload a backup JSON file to restore (⚠️ overwrites current data; confirmation required).

#### 4.8.7 Project Credentials

Manage login passwords for Project Users:

- **Generate** — creates a random secure password.
- **Save** — stores the password for that project.
- **Copy** — copies the password to the clipboard to share with the project user.

### 4.9 Alerts

System-generated alerts for project health:

- **Critical** (red): overdue, no budget, budget overrun.
- **Warning** (yellow): due within 14 days, budget near limit.
- **Info** (blue): general updates.
- Click an alert card to go to the related project.

### 4.10 Report Export

Export data to Excel (.xlsx):

- **📥 Export Projects** — 12 columns (ID, name, manager, holder, status, budget, budget used, dates, grant, support).
- **📥 Export Ideas** — 11 columns.
- **📥 Export Funding Schemes** — 8 columns.
- **📦 Export All** — one workbook with 3 sheets (Projects / Ideas / Funding Schemes).

*Note: current export uses sample/demo dataset.*

---

## 5. Admin Manual

*Admins can manage projects and run AI analysis, but cannot approve/reject ideas or change system settings.*

### 5.1 Dashboard

Same as Superadmin — KPI cards, health chart, upcoming projects, recent ideas.

### 5.2 All Projects

Browse all projects (same browsing experience as Superadmin).

### 5.3 My Projects

View and manage projects you are involved with (same as Superadmin).

### 5.4 Pending Approval (Admin view)

Admins can **view** all idea sections (Pending / Approved / Rejected / Deleted).

**AI features available to Admin:**

- **🤖 AI Analyze** — run AI analysis on Pending ideas with no report.
- **📊 AI Report** — view the saved report (scorecard + full report).
- **📄 Export Word** — export the report to Word.

**NOT available to Admin:**

- ❌ Approve / Reject ideas
- ❌ Re-Analyze (regenerate a new report)
- ❌ Soft Delete / Restore / Permanent Delete

### 5.5 Approved Projects / Submit Idea / Funding Schemes / Alerts

Same as Superadmin, **except** Funding Schemes is browse-only (no Add/Edit/Delete).

### 5.6 Account

- Change Password (see section 3.5).
- Forgot Password (see section 3.4).

---

## 6. Project User Manual

*Project Users log in with a Project ID + password and see only their own project.*

### 6.1 Login

1. On the login page, click the **Project Login** tab.
2. Enter your **Project ID** and **Password** (provided by your system administrator).
3. Click **Login to Project**.

### 6.2 My Project page

This is the only page available. It shows your project with:

**Project Overview**

- Project ID, name, status badge, health indicator.
- Manager / Holder details.
- Budget information.

**Detailed Sections**

- Background, pain points, benefits.
- Key milestones and dates.
- Budget usage.
- Project stages (with progress).
- Activity log (recent changes by users).

**Edit your project** *(basic fields)*

1. Click **Edit**.
2. Update any of: Name, Description, Detail Content, Status, Start/End Date, Budget, Budget Used, Manager, Holder, Background, Pain Point, Benefits, Deliverables.
3. Click **Save** — the change is recorded in the activity log.

### 6.3 If no project is assigned

You will see: *"No project found for your account. Please contact the system administrator."* — contact support (section 9).

---

## 7. Guest Manual

*Guests can explore the system without logging in.*

### 7.1 Enter as Guest

1. On the login page, click the **Guest** button.

### 7.2 What Guests Can Do

- **All Projects** — browse every project (name, ID, status, description, owner).
- **Submit Idea** — fill in the full 8-step idea submission wizard and submit for review.
- **Funding Schemes** — browse available funding schemes (search by name/provider).

### 7.3 What Guests Cannot Do

- ❌ Dashboard / My Projects / Pending Approval / Settings / Alerts / Report Export.

---

## 8. Troubleshooting & FAQ

### Q1: I forgot my password.

Go to login page → **Admin Login** tab → click **Forgot Password?** → enter your email → check inbox and follow the reset link.

### Q2: I want to change my password.

Go to login page → **Admin Login** tab → click **Change Password** → enter email, current password, and new password (min 6 chars).

### Q3: AI Analysis fails with "Failed to fetch".

- Check your internet connection.
- If using a custom/local endpoint (e.g. Ollama), make sure it is running and reachable.
- If you are running the app locally, ensure the backend server (port 5000) is started.
- Try again or use a different provider/model.

### Q4: AI returns "invalid analysis format".

- The AI model did not return proper JSON. Click **Run Analysis** again, or try a different model (e.g. `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` on Cloudflare, which is the recommended default).

### Q5: Can an Admin approve ideas?

No. Only **Superadmin** can approve/reject ideas, restore/delete, or change system settings.

### Q6: Can a Guest submit an idea?

Yes. Click **Submit Idea** and fill in the wizard.

### Q7: My report has no "Full Report" section.

The AI must output a `report` key in its JSON. Try the DeepSeek model or run **Re-Analyze**.

### Q8: The modal closes when I click outside.

Modal windows can only be closed via the ✕ or Cancel button — clicking outside no longer closes them.

### Q9: Can I export the AI report to Word later?

Yes. Open **📊 AI Report** on the idea card at any time, then click **📄 Export Word**.

### Q10: The app URL is hard to remember.

You may rename the Vercel project in **Vercel Dashboard → Settings → General → Project Name** to get a shorter URL, or add a custom domain.

---

## 9. Support

If you encounter any issues, have questions, or need a Project ID / password, please contact:

**Don Kwan**  
📧 **don.kwan@asiaalliedgroup.com**  
📞 **3798 5724**

*Please provide the following information when contacting support:*
- Your role (Superadmin / Admin / Project User / Guest)
- The page/function you were using
- A description of the problem (and if possible, a screenshot)
- The approximate date/time of the issue

---

*© Asia Allied Group – I&D Hub v2.0*
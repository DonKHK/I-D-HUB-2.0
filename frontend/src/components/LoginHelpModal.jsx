import React from 'react';
import Modal from './Modal';

export default function LoginHelpModal({ open, onClose }) {
  return (
    <Modal isOpen={open} onClose={onClose} title="📖 功能說明">
      <div className="help-modal-body">
        <p className="help-intro">
          I&D Hub(Innovation & Development Hub)係 AAI 集團嘅創新意念同項目管理平台：同事可以提交創新意念、管理員審批並自動建立項目、追蹤進度同預算，仲有 AI 助手協助分析同撰寫計劃書。
        </p>

        <h4>📊 系統功能總覽</h4>
        <ul className="help-list">
          <li><strong>Dashboard 總覽</strong> — KPI 統計、Project Health 分佈圖、即將到期/逾期項目、Recent Ideas、AI Assistant</li>
          <li><strong>All Projects 全部項目</strong> — 瀏覽所有項目(訪客亦可)</li>
          <li><strong>My Projects 我的項目</strong> — 管理員/系統管理員嘅項目管理頁：卡片顯示健康狀態、按 ID/Idea 跳轉、編輯或刪除項目</li>
          <li><strong>My Project 我的項目(項目用戶)</strong> — PM/Owner 登入後只睇到自己嘅項目並更新進度</li>
          <li><strong>Pending Approval 待審批</strong> — 審批/拒絕意念、AI 分析、狀態分頁(Pending / Approved / Rejected / Deleted)</li>
          <li><strong>Approved Projects 已核准項目</strong> — 已核准嘅 Idea 一覽，可永久刪除</li>
          <li><strong>Submit Idea 提交意念</strong> — 8 步驟申請表(申請人/項目經理/項目持有者/預算/技術等)</li>
          <li><strong>Funding Schemes 資助計劃</strong> — 香港政府資助計劃資料庫，AI Funding Finder 可自動幫你搵 funding</li>
          <li><strong>Alerts 警報</strong> — 逾期/預算超支/無預算等健康警報</li>
          <li><strong>Settings 設定</strong> — 逾期/預算臨界值、警報顏色、AI prompt、密碼管理(只限 Superadmin)</li>
          <li><strong>Report Export 匯出</strong> — 匯出 Projects / Ideas / Funding Schemes 做 Excel(只限 Superadmin)</li>
          <li><strong>More Features 更多工具</strong> — AI Business Plan 商業計劃書、Commercialization 商品化計劃書</li>
        </ul>

        <h4>🤖 AI 功能</h4>
        <ul className="help-list">
          <li><strong>AI Idea Analysis</strong> — Pending Approval 入面對每條 Idea 做 7 維評分(創意/市場需求/現有方案/預算可行性/時間/範圍/風險)+ 完整報告，可匯出 Word；Superadmin 可 Re-Analyze</li>
          <li><strong>AI Assistant</strong> — Dashboard 底部對話框，可即時問項目/意念狀況</li>
          <li><strong>AI Business Plan</strong> — 按問卷自動生成專業商業計劃書</li>
          <li><strong>AI Commercialization Plan</strong> — 商品化/市場化計劃書</li>
          <li><strong>AI Funding Finder</strong> — Funding Schemes 入面自動搵適合嘅政府 funding 並可加入列表</li>
          <li>支援 OpenAI / DeepSeek / Cloudflare Workers AI / Custom endpoint；API Key 儲存喺自己瀏覽器，唔會上傳</li>
        </ul>

        <h4>🔐 登入級別及權限</h4>
        <div className="help-role">
          <h5>👤 Guest 訪客(一㩒即入)</h5>
          <p>瀏覽 All Projects 同 Funding Schemes、提交 Idea、用 More Features 工具。唔可以睇項目管理/審批頁面。</p>
        </div>
        <div className="help-role">
          <h5>👨‍💼 Admin 管理員</h5>
          <p>Dashboard / All Projects / My Projects / Pending Approval(可 AI Analyze、睇 AI Report、匯出 Word)/ Approved Projects / Submit Idea / Funding Schemes(瀏覽)/ Alerts。唔可以審批或刪除意念、改 Settings、匯出報表或編輯/刪除項目。</p>
        </div>
        <div className="help-role">
          <h5>👑 Superadmin 系統管理員</h5>
          <p>擁有全部功能：審批/拒絕/刪除/恢復意念、AI Re-Analyze、編輯及刪除項目、Settings、Report Export、Funding Schemes 新增/編輯/刪除、AI Funding Finder。</p>
        </div>
        <div className="help-role">
          <h5>🛠️ Project User 項目用戶(PM / Owner)</h5>
          <p>用 Project ID + pm/owner 登入，只可進入自己嗰個項目頁(My Project)更新階段進度同預算，並使用 More Features 工具。</p>
        </div>

        <div className="help-developer">
          <p><strong>Developer : Don Kwan</strong></p>
          <p>E-Mail : don.kwan@asiaalliedgroup.com</p>
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn btn--primary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

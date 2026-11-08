/* =========================================================================
   staff-pages.js — ตัวช่วยกลางของหน้าเจ้าหน้าที่ส่วนบริหาร (เมนูข้อ 4–8)
   • StaffPage.init(pageId)  ตั้งบทบาท staff + วาด sidebar + เมนู Research Admin Module
   • StaffAudit.log()/list() บันทึกประวัติการใช้งาน (localStorage rgms_staff_audit)
   • StaffPage.csv() ดาวน์โหลด CSV (UTF-8 BOM ให้ Excel อ่านภาษาไทยได้)
   ไม่แก้ shared.js — อ่าน/เขียนผ่าน RGMS และ localStorage ของตัวเอง
   ========================================================================= */
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function ld(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function nowBE() { var d = new Date(); return (d.getFullYear() + 543) + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }

  var AKEY = "rgms_staff_audit";
  var StaffAudit = {
    log: function (action, detail, type) {
      var l = ld(AKEY, []);
      l.unshift({ at: nowBE(), by: RGMS.currentRole().name, action: action, detail: detail || "", type: type || "other" });
      sv(AKEY, l.slice(0, 300));
    },
    local: function () { return ld(AKEY, []); },
    /* รวมประวัติจากข้อมูลโครงการ (history) + บันทึกที่เจ้าหน้าที่ทำในต้นแบบ */
    all: function () {
      var rows = [];
      RGMS.PROJECTS.forEach(function (p) {
        (p.history || []).forEach(function (h) { if (h.at) rows.push({ at: h.at, by: h.by, action: h.action, detail: p.id + " · " + p.title, type: "project" }); });
      });
      RGMS.MEETINGS.forEach(function (m) {
        if (m.status === "minuted") rows.push({ at: m.date, by: "คณะกรรมการส่งเสริมฯ", action: "บันทึกมติการประชุม " + m.no, detail: m.items.length + " โครงการ", type: "meeting" });
      });
      return StaffAudit.local().concat(rows).sort(function (a, b) { return a.at < b.at ? 1 : a.at > b.at ? -1 : 0; });
    }
  };

  function csv(filename, head, rows) {
    function cell(v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    var txt = "﻿" + [head].concat(rows).map(function (r) { return r.map(cell).join(","); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
    a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }


  /* ---------- ปุ่มรีเซ็ตมุมขวาล่าง (โหมดทดสอบ) — ล้างข้อมูลที่ทดลองทำในหน้านั้น แล้วโหลดหน้าใหม่ ---------- */
  var RESET_KEYS = {
    "staff-finance": ["rgms_staff_inst", "rgms_staff_closed"],
    "staff-roles":   ["rgms_staff_users"],
    "staff-export":  ["rgms_staff_eoffice"],
    "staff-audit":   ["rgms_staff_audit", "rgms_staff_log"],
    "staff-calls":   ["rgms_calls_custom", "rgms_calls_edits", "rgms_call_status"],
    "staff-agenda":  ["rgms_decision", "rgms_announced", "rgms_exec_meta", "rgms_exec_log", "rgms_exec_announcements", "rgms_exec_resubmitted"]
  };
  var RESET_WHAT = {
    "staff-finance": "การอนุมัติเบิกจ่ายงวดและการปิดโครงการ", "staff-roles": "การเพิ่ม/แก้บทบาท/ระงับผู้ใช้", "staff-export": "ประวัติการส่ง e-Office",
    "staff-audit": "ประวัติที่เจ้าหน้าที่ทำในต้นแบบ", "staff-calls": "รอบทุนที่สร้าง/แก้ไข และสถานะเปิด-ปิดรับ", "staff-agenda": "มติ ประกาศผล และบันทึกที่ลงไว้"
  };
  var FAB_CSS = ".fab-reset{position:fixed;right:24px;bottom:24px;z-index:900;width:52px;height:52px;border-radius:50%;padding:0;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#96181F 0%,#851419 100%);border:1px solid #680E12;color:#fff;cursor:pointer;box-shadow:0 4px 12px rgba(133,20,25,.35);transition:transform .2s,box-shadow .2s}" +
    ".fab-reset:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(133,20,25,.4);color:#fff}.fab-reset svg{width:24px;height:24px;transition:transform .5s}.fab-reset:hover svg{transform:rotate(360deg)}" +
    ".fab-reset:focus-visible{outline:3px solid #2563eb;outline-offset:3px}.fab-reset.spin svg{animation:fab-spin .6s ease}@keyframes fab-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}";
  function mountReset(pageId) {
    var keys = RESET_KEYS[pageId];
    if (!keys || document.getElementById("fab-reset")) return;
    if (!document.querySelector('link[href*="staff.css"]') && !document.getElementById("sp-fab-style")) {   // หน้าที่ไม่ได้โหลด staff.css (เช่น staff-agenda)
      var st = document.createElement("style"); st.id = "sp-fab-style"; st.textContent = FAB_CSS; document.head.appendChild(st);
    }
    var b = document.createElement("button");
    b.type = "button"; b.className = "fab-reset"; b.id = "fab-reset";
    b.setAttribute("aria-label", "รีเซ็ตข้อมูลทดสอบของหน้านี้ เพื่อทดสอบใหม่");
    b.title = "รีเซ็ตเพื่อทดสอบใหม่ — ล้าง" + RESET_WHAT[pageId];
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
    b.addEventListener("click", function () {
      if (b.disabled) return; b.disabled = true;
      b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
      keys.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      if (window.RGMS && RGMS.toast) RGMS.toast("รีเซ็ตแล้ว — ล้าง" + RESET_WHAT[pageId], "accent");
      setTimeout(function () { location.reload(); }, 650);      // รอให้เห็นลูกศรหมุนก่อนโหลดใหม่
    });
    document.body.appendChild(b);
  }

  function init(pageId) {
    RGMS.setRole("staff");           // หน้าเหล่านี้เป็นของเจ้าหน้าที่ส่วนบริหาร
    RGMS.renderAppNav(pageId);
    StaffNav.mount(pageId);
    mountReset(pageId);
  }
  window.StaffAudit = StaffAudit;
  window.StaffPage = { init: init, mountReset: mountReset, esc: esc, ld: ld, sv: sv, csv: csv, nowBE: nowBE };
})();

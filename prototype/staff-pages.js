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

  function init(pageId) {
    RGMS.setRole("staff");           // หน้าเหล่านี้เป็นของเจ้าหน้าที่ส่วนบริหาร
    RGMS.renderAppNav(pageId);
    StaffNav.mount(pageId);
  }
  window.StaffAudit = StaffAudit;
  window.StaffPage = { init: init, esc: esc, ld: ld, sv: sv, csv: csv, nowBE: nowBE };
})();

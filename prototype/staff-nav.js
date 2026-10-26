/* =========================================================================
   staff-nav.js — เมนู "RESEARCH ADMIN MODULE" ของเจ้าหน้าที่ส่วนบริหาร
   โหลดต่อจาก shared.js แล้วเรียก StaffNav.mount("<pageId>") แทนที่รายการเมนูใน sidebar
   (ไม่แก้ shared.js — ใช้โครง/สไตล์ .app-sidebar เดิม)
   ========================================================================= */
(function () {
  function ic(d) { return '<svg class="sn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var I = {
    grid:  ic('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    clip:  ic('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 12h6M9 16h4"/>'),
    cal:   ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    users: ic('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.3c1.8.8 3 2.7 3 5.7"/>'),
    shield:ic('<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    cash:  ic('<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="2.6"/><path d="M6 7V5h12v2"/>'),
    out:   ic('<path d="M12 3v11M8 10l4 4 4-4"/><path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>'),
    clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    flag:  ic('<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>')
  };
  var ITEMS = [
    { id: "exec-overview", n: "1.", label: "ภาพรวมส่วนบริหาร", icon: I.grid, href: "exec-overview.html" },
    { id: "staff-queue",   n: "2.", label: "กล่องคัดกรอง & ตรวจงบ 17.2", icon: I.clip, href: "staff-queue.html", count: true },
    { id: "staff-agenda",  n: "3.", label: "วาระประชุม e-Agenda", icon: I.cal, href: "staff-agenda.html" },
    { id: "staff-team",    n: "4.", label: "คุมภาระงานเจ้าหน้าที่", icon: I.users, href: "staff-team.html" },
    { id: "staff-roles",   n: "5.", label: "จัดการสิทธิ์ผู้ใช้งาน (FR-76)", icon: I.shield, href: "staff-roles.html" },
    { id: "staff-finance", n: "6.", label: "คุมงวดเงิน & ปิดโครงการ", icon: I.cash, href: "staff-finance.html" },
    { id: "staff-export",  n: "7.", label: "ส่งออกรายงาน & e-Office", icon: I.out, href: "staff-export.html" },
    { id: "staff-audit",   n: "8.", label: "ประวัติการใช้งาน Audit Log", icon: I.clock, href: "staff-audit.html" },
    { id: "staff-calls",   n: "",   label: "เปิดรับทุน / รอบทุน", icon: I.flag, href: "staff-calls.html" }
  ];

  function mount(pageId) {
    var nav = document.querySelector(".app-sidebar__nav");
    if (!nav) return;
    var pending = RGMS.PROJECTS.filter(function (p) { return p.status === "submitted" || p.status === "screening"; }).length;
    var html = '<div class="app-sidebar__group"><span class="app-sidebar__group-label">Research Admin Module</span></div>';
    ITEMS.forEach(function (it) {
      var on = it.id === pageId ? " is-active" : "";
      var cnt = it.count && pending ? '<span class="tag-count" data-nav-count="' + it.id + '">' + pending + '</span>' : "";
      var attrs = it.href ? 'href="' + it.href + '"' : 'href="#" data-soon="' + it.label + '"';
      html += '<a class="app-sidebar__link sn-link' + on + '" ' + attrs + (on ? ' aria-current="page"' : '') + '>' +
        it.icon + '<span class="app-sidebar__link-label">' + (it.n ? it.n + ' ' : '') + it.label + '</span>' + cnt + '</a>';
    });
    nav.classList.add("sn-nav");
    nav.innerHTML = html;
    nav.addEventListener("click", function (e) {
      var a = e.target.closest("[data-soon]"); if (!a) return;
      e.preventDefault(); RGMS.toast("“" + a.getAttribute("data-soon") + "” ยังไม่อยู่ในต้นแบบนี้", "accent");
    });
  }

  /* ---------- ตัวช่วยกลางของหน้าเจ้าหน้าที่ ---------- */
  var K_LOG = "rgms_staff_log";
  function rd(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function stamp() { var d = new Date(); return d.getDate() + " " + MON[d.getMonth()] + " " + (d.getFullYear() + 543) + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()); }
  function log(action, text, pid) {
    var all = rd(K_LOG, []);
    all.push({ action: action, text: text, id: pid || "", at: stamp(), by: RGMS.currentRole().name, ts: Date.now() });
    wr(K_LOG, all.slice(-500));
  }
  function csv(filename, rows) {
    var body = rows.map(function (r) { return r.map(function (c) { c = String(c == null ? "" : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\r\n");
    var blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function boot(pageId) { RGMS.setRole("staff"); RGMS.renderAppNav(pageId); mount(pageId); }
  window.StaffNav = { mount: mount, boot: boot, log: log, logs: function () { return rd(K_LOG, []); }, rd: rd, wr: wr, esc: esc, csv: csv, stamp: stamp };
})();

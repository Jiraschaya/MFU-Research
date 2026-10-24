/* =========================================================================
   exec.js — ตรรกะฝั่งผู้บริหาร / คณะกรรมการส่งเสริมและพัฒนางานวิจัย (คกก.ส่งเสริม)

   ครอบคลุมทั้งวงจรของผู้บริหารในเฟส 1 ตาม user flow ของอาจารย์ (04-executive.md):
     1) มติจัดสรรทุน 3 แบบ  — อนุมัติ / อนุมัติแบบมีเงื่อนไข / ไม่อนุมัติ  (FR-24, FR-25)
     2) วงปรับแก้ตามเงื่อนไข — นักวิจัยแก้แล้วกลับเข้าวาระ                 (FR-26)
     3) ลงนามประกาศผล       — รองอธิการบดี (e-Office, จำลอง) + แจ้งเตือน   (FR-59, FR-78)
     4) ภาพรวมพอร์ตทุน       — funnel / งบ / อัตราอนุมัติ / เจาะสำนักวิชา    (FR-39, FR-40)
     5) ประวัติการดำเนินการ (audit) ต่อโครงการ                              (NFR-02)

   พึ่งพา shared.js เท่านั้น (window.RGMS) — ต้องโหลดหลัง shared.js
   เก็บข้อมูลเพิ่มเติมใน localStorage (โหมดสาธิต) ด้วยคีย์ rgms_exec_*
   ส่วนมติหลัก (approve / approve_revise / reject) ยังใช้ RGMS.setDecision เดิม
   เพื่อให้หน้าอื่น (researcher-home, project-detail, staff-queue) เห็นสถานะตรงกัน
   ========================================================================= */
(function (R) {
  "use strict";
  if (!R) { return; }

  var K_META = "rgms_exec_meta";            // id -> { note, amount, meetingNo, at, by, resubmittedAt }
  var K_LOG = "rgms_exec_log";              // [{ id, action, text, at, by, ts }]
  var K_ANN = "rgms_exec_announcements";    // [{ no, fy, at, ts, signer, meetingNo, ids, approvedTotal, notified }]
  var K_RESUB = "rgms_exec_resubmitted";    // id -> true  (shared.js อ่านคีย์นี้ใน effectiveStatus)

  var SIGNER = "รองอธิการบดีฝ่ายวิจัย (ปฏิบัติการแทนอธิการบดี)";
  var CODES = ["approve", "approve_revise", "reject"];
  var MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  /* -------- storage -------- */
  function read(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }

  /* -------- utils -------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function stamp() {
    var d = new Date();
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + (d.getFullYear() + 543) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function thaiDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    if (!m) { return iso || "—"; }
    return parseInt(m[3], 10) + " " + MONTHS[parseInt(m[2], 10) - 1] + " " + m[1];
  }
  function me() { return R.currentRole().name; }

  /* -------- การประชุมที่เปิดบันทึกมติอยู่ -------- */
  function meeting() {
    var m = (R.MEETINGS || []).filter(function (x) { return x.status === "draft"; })[0];
    return m || { no: "—", date: null, committee: "คณะกรรมการส่งเสริมและพัฒนางานวิจัย" };
  }
  /* มติจากการประชุมครั้งก่อน (ข้อมูลเริ่มต้นใน MEETINGS) ของโครงการนี้ — ใช้อธิบายโครงการที่ติดสถานะมาจากรอบก่อน */
  function pastMeetingOf(id) {
    var found = null;
    (R.MEETINGS || []).forEach(function (m) {
      (m.items || []).forEach(function (it) { if (it.projectId === id) { found = { no: m.no, date: m.date, resolution: it.resolution }; } });
    });
    return found;
  }

  /* -------- เพดานงบ / งบอนุมัติ -------- */
  function capOf(p) { return R.tierOf(p).cap; }
  function defaultAmount(p) { return Math.min(p.budgetReq, capOf(p)); }

  /* -------- มติของโครงการ (ผสมมติที่บันทึกในระบบ + ข้อมูลเริ่มต้นที่สถานะฐานเป็นมติแล้ว) -------- */
  function resubmitted(id) { return !!read(K_RESUB, {})[id]; }
  function resolutionOf(id) {
    var p = R.getProject(id);
    if (!p) { return null; }
    var code = R.decisionOf(id);
    var meta = read(K_META, {})[id] || null;
    if (code) {
      return {
        code: code,
        note: meta ? meta.note : "",
        amount: meta && meta.amount != null ? meta.amount : (code === "reject" ? 0 : p.budgetReq),
        meetingNo: meta ? meta.meetingNo : null,
        at: meta ? meta.at : null,
        by: meta ? meta.by : null,
        source: meta ? "exec" : "seed"
      };
    }
    var past = pastMeetingOf(id);
    if (p.status === "approved") {
      return { code: "approve", note: "เห็นชอบตามข้อเสนอของคณะอนุกรรมการ", amount: p.budgetReq, meetingNo: past ? past.no : null, at: past ? thaiDate(past.date) : null, by: null, source: "seed" };
    }
    if (p.status === "rejected") {
      return { code: "reject", note: "ไม่ผ่านเกณฑ์การพิจารณา (ดูข้อคิดเห็นของคณะอนุกรรมการ)", amount: 0, meetingNo: past ? past.no : null, at: past ? thaiDate(past.date) : null, by: null, source: "seed" };
    }
    if (p.status === "revise" && R.bothTracksCleared(id) && !resubmitted(id)) {
      return { code: "approve_revise", note: "ให้ปรับแก้ตามข้อเสนอแนะของคณะอนุกรรมการและเงื่อนไขของที่ประชุม", amount: p.budgetReq, meetingNo: past ? past.no : null, at: past ? thaiDate(past.date) : null, by: null, source: "seed" };
    }
    return null;
  }

  /* -------- สถานะในมุมผู้บริหาร --------
     ready = ทั้ง 2 แทร็กรับรองแล้ว และยังไม่มีมติ (รอบันทึกมติ)
     review = ยังติดแทร็กใดแทร็กหนึ่ง          conditional = มีมติให้ปรับแก้ รอนักวิจัย */
  function stateOf(p) {
    if (R.isAnnounced(p.id)) { return "announced"; }
    var r = resolutionOf(p.id);
    if (r) { return r.code === "approve" ? "decided_approve" : r.code === "reject" ? "decided_reject" : "conditional"; }
    var st = p.status;
    if (st === "submitted") { return "submitted"; }
    if (st === "screening") { return "screening"; }
    if (st === "review" || st === "revise" || st === "committee") { return R.bothTracksCleared(p.id) ? "ready" : "review"; }
    if (["ongoing", "progress", "final", "financial", "closed"].indexOf(st) >= 0) { return "running"; }
    return "other";
  }
  function listByState(state) { return R.PROJECTS.filter(function (p) { return stateOf(p) === state; }); }
  function pendingCount() { return listByState("ready").length; }
  /* โครงการที่ยังติดแทร็กใดแทร็กหนึ่ง แต่อยู่ในช่วงพิจารณา — ไว้ให้ผู้บริหารเห็นว่าติดที่ไหน */
  function blockedList() { return listByState("review"); }
  /* มีมติแล้วที่พร้อมลงนามประกาศ = อนุมัติ/ไม่อนุมัติ และยังไม่ประกาศ (มติแบบมีเงื่อนไขยังไม่ประกาศ) */
  function readyToAnnounce() {
    return R.PROJECTS.filter(function (p) { var s = stateOf(p); return s === "decided_approve" || s === "decided_reject"; });
  }
  function awaitingResearcher() { return listByState("conditional"); }
  function announcedList() { return listByState("announced"); }

  /* -------- สรุปประกอบการพิจารณา (ไม่เปิดเผยชื่อผู้ประเมิน) -------- */
  function reviewerDigest(p) {
    return (p.reviewers || []).filter(function (r) { return r.submitted; }).map(function (r, i) {
      return { label: "อนุกรรมการท่านที่ " + (i + 1), recommend: r.recommend, comment: r.comment || "" };
    });
  }
  function recommendationHint(p) {
    var subs = reviewerDigest(p);
    if (!subs.length) { return { text: "ยังไม่มีความเห็นอนุกรรมการ", code: null }; }
    var recs = subs.map(function (x) { return x.recommend; });
    if (recs.indexOf("reject") >= 0) { return { text: "มีความเห็นไม่สนับสนุน", code: "reject" }; }
    if (recs.every(function (x) { return x === "approve"; })) { return { text: "รับรองครบ · ไม่มีข้อแก้ไข", code: "approve" }; }
    return { text: "รับรองแบบมีข้อเสนอแนะ", code: "approve_revise" };
  }

  /* -------- ประวัติ (audit log) -------- */
  function log(id, action, text) {
    var all = read(K_LOG, []);
    all.push({ id: id, action: action, text: text, at: stamp(), by: me(), ts: Date.now() });
    write(K_LOG, all);
  }
  function logsOf(id) {
    return read(K_LOG, []).filter(function (e) { return e.id === id; }).sort(function (a, b) { return b.ts - a.ts; });
  }

  /* -------- บันทึก / แก้ไข / ยกเลิกมติ -------- */
  function validate(p, v) {
    var errs = {};
    var note = String(v.note || "").trim();
    if (CODES.indexOf(v.code) < 0) { errs.code = "กรุณาเลือกมติ"; return errs; }
    if (v.code === "approve_revise" && note.length < 5) { errs.note = "ระบุเงื่อนไขที่ต้องปรับแก้ (อย่างน้อย 5 ตัวอักษร) — นักวิจัยจะเห็นข้อความนี้"; }
    if (v.code === "reject" && note.length < 5) { errs.note = "ระบุเหตุผลที่ไม่อนุมัติ (อย่างน้อย 5 ตัวอักษร) — นักวิจัยจะเห็นข้อความนี้"; }
    if (v.code !== "reject") {
      var a = Number(v.amount);
      var t = R.tierOf(p);
      if (!isFinite(a) || a <= 0 || Math.floor(a) !== a) { errs.amount = "ระบุงบที่อนุมัติเป็นจำนวนเต็มบาท มากกว่า 0"; }
      else if (a > p.budgetReq) { errs.amount = "งบที่อนุมัติต้องไม่เกินงบที่ขอ (" + R.fmtMoney(p.budgetReq) + " บาท)"; }
      else if (a > t.cap) { errs.amount = "เกินเพดาน" + t.label + " (" + R.fmtMoney(t.cap) + " บาท)"; }
    }
    return errs;
  }
  function saveResolution(id, v) {
    var p = R.getProject(id);
    if (!p) { return { ok: false, errors: { code: "ไม่พบโครงการ" } }; }
    var errs = validate(p, v);
    if (Object.keys(errs).length) { return { ok: false, errors: errs }; }
    var note = String(v.note || "").trim();
    var amount = v.code === "reject" ? 0 : Number(v.amount);
    R.setDecision(id, v.code);
    var meta = read(K_META, {});
    meta[id] = { note: note, amount: amount, meetingNo: meeting().no, at: stamp(), by: me() };
    write(K_META, meta);
    var label = R.RESOLUTION[v.code];
    log(id, "resolved", "บันทึกมติ: " + label + (v.code === "reject" ? "" : " · งบอนุมัติ " + R.fmtMoney(amount) + " บาท") + (note ? " · " + note : "") + " (การประชุมครั้งที่ " + meeting().no + ")");
    return { ok: true };
  }
  /* ยกเลิกมติ — ทำได้เฉพาะมติที่บันทึกผ่านระบบ และยังไม่ประกาศ */
  function undoResolution(id) {
    var r = resolutionOf(id);
    if (!r || r.source !== "exec" || R.isAnnounced(id)) { return false; }
    R.setDecision(id, null);
    var meta = read(K_META, {});
    delete meta[id];
    write(K_META, meta);
    log(id, "undone", "ยกเลิกมติ \"" + R.RESOLUTION[r.code] + "\" — กลับสู่รอบันทึกมติ");
    return true;
  }
  /* นักวิจัยส่งฉบับปรับแก้ตามเงื่อนไขของที่ประชุม → กลับเข้าวาระ (FR-26) */
  function conditionOf(id) {
    var r = resolutionOf(id);
    return r && r.code === "approve_revise" ? r : null;
  }
  function resubmitToCommittee(id) {
    var r = conditionOf(id);
    if (!r) { return false; }
    R.setDecision(id, null);
    var flags = read(K_RESUB, {});
    flags[id] = true;
    write(K_RESUB, flags);
    var meta = read(K_META, {});
    if (meta[id]) { meta[id].resubmittedAt = stamp(); write(K_META, meta); }
    log(id, "resubmitted", "นักวิจัยส่งฉบับปรับแก้ตามเงื่อนไขของที่ประชุม — กลับเข้าวาระ (การประชุมครั้งที่ " + meeting().no + ")");
    return true;
  }

  /* -------- ลงนามและประกาศผล -------- */
  function announcements() { return read(K_ANN, []).slice().reverse(); }
  function nextAnnouncementNo() {
    var fy = R.CURRENT_FY;
    return (read(K_ANN, []).filter(function (a) { return a.fy === fy; }).length + 1) + "/" + fy;
  }
  function announcementOf(id) {
    var found = null;
    read(K_ANN, []).forEach(function (a) { if (a.ids.indexOf(id) >= 0) { found = a; } });
    return found;
  }
  function previewAnnouncement(ids) {
    var approved = [], rejected = [], total = 0;
    ids.forEach(function (id) {
      var p = R.getProject(id), r = resolutionOf(id);
      if (!p || !r) { return; }
      if (r.code === "approve") { approved.push({ p: p, amount: r.amount, note: r.note }); total += r.amount; }
      else if (r.code === "reject") { rejected.push({ p: p, note: r.note }); }
    });
    return { no: nextAnnouncementNo(), date: stamp(), meetingNo: meeting().no, signer: SIGNER, approved: approved, rejected: rejected, total: total };
  }
  function announceBatch(ids) {
    var pv = previewAnnouncement(ids);
    var valid = pv.approved.map(function (x) { return x.p.id; }).concat(pv.rejected.map(function (x) { return x.p.id; }));
    if (!valid.length) { return null; }
    var rec = {
      no: pv.no, fy: R.CURRENT_FY, at: pv.date, ts: Date.now(), signer: SIGNER, meetingNo: pv.meetingNo,
      ids: valid, approvedTotal: pv.total,
      notified: { email: valid.length, inapp: valid.length, todo: pv.approved.length, secretary: pv.approved.length }
    };
    var all = read(K_ANN, []);
    all.push(rec);
    write(K_ANN, all);
    R.announce(valid);
    valid.forEach(function (id) { log(id, "announced", "ลงนามและประกาศผล ฉบับที่ " + rec.no + " (" + SIGNER + ")"); });
    return rec;
  }

  /* -------- ภาพรวมพอร์ตทุน (FR-39 / FR-40) -------- */
  var RANK = { submitted: 1, screening: 2, review: 3, ready: 4, conditional: 5, decided_approve: 5, decided_reject: 5, announced: 6, running: 6 };
  function verdictOf(p) {
    var s = stateOf(p);
    if (s === "running") { return "approve"; }
    var r = resolutionOf(p.id);
    return r ? r.code : null;
  }
  function approvedAmountOf(p) {
    var s = stateOf(p);
    if (s === "running") { return p.budgetReq; }
    var r = resolutionOf(p.id);
    return r && r.code !== "reject" ? r.amount : 0;
  }
  function portfolio(opts) {
    opts = opts || {};
    var list = R.PROJECTS.filter(function (p) {
      return RANK[stateOf(p)] && (!opts.fy || R.fyOf(p) === opts.fy) && (!opts.school || p.school === opts.school);
    });
    var out = { total: list.length, current: {}, reach: {}, requested: 0, approved: 0, approveN: 0, rejectN: 0, conditionalN: 0, byTier: [], bySchool: [], list: list };
    list.forEach(function (p) {
      var s = stateOf(p), rk = RANK[s], v = verdictOf(p);
      out.current[s] = (out.current[s] || 0) + 1;
      for (var k = 1; k <= rk; k++) { out.reach[k] = (out.reach[k] || 0) + 1; }
      out.requested += p.budgetReq;
      out.approved += approvedAmountOf(p);
      if (v === "approve") { out.approveN++; } else if (v === "reject") { out.rejectN++; } else if (v === "approve_revise") { out.conditionalN++; }
    });
    out.rate = (out.approveN + out.rejectN) ? Math.round(out.approveN * 100 / (out.approveN + out.rejectN)) : null;

    Object.keys(R.TIERS).forEach(function (k) {
      var t = R.TIERS[k], row = { tier: t, n: 0, requested: 0, approved: 0 };
      list.forEach(function (p) { if (R.tierOf(p).id === t.id) { row.n++; row.requested += p.budgetReq; row.approved += approvedAmountOf(p); } });
      out.byTier.push(row);
    });
    R.SCHOOLS.forEach(function (sc) {
      var row = { school: sc, n: 0, requested: 0, approved: 0, ready: 0, approveN: 0, rejectN: 0 };
      list.forEach(function (p) {
        if (p.school !== sc) { return; }
        row.n++; row.requested += p.budgetReq; row.approved += approvedAmountOf(p);
        if (stateOf(p) === "ready") { row.ready++; }
        var v = verdictOf(p);
        if (v === "approve") { row.approveN++; } else if (v === "reject") { row.rejectN++; }
      });
      row.rate = (row.approveN + row.rejectN) ? Math.round(row.approveN * 100 / (row.approveN + row.rejectN)) : null;
      out.bySchool.push(row);
    });
    return out;
  }

  R.exec = {
    SIGNER: SIGNER, esc: esc, thaiDate: thaiDate, stamp: stamp,
    meeting: meeting, pastMeetingOf: pastMeetingOf,
    capOf: capOf, defaultAmount: defaultAmount,
    resolutionOf: resolutionOf, stateOf: stateOf, listByState: listByState,
    pendingCount: pendingCount, blockedList: blockedList, readyToAnnounce: readyToAnnounce,
    awaitingResearcher: awaitingResearcher, announcedList: announcedList,
    reviewerDigest: reviewerDigest, recommendationHint: recommendationHint,
    log: log, logsOf: logsOf,
    validate: validate, saveResolution: saveResolution, undoResolution: undoResolution,
    conditionOf: conditionOf, resubmitToCommittee: resubmitToCommittee,
    announcements: announcements, announcementOf: announcementOf, nextAnnouncementNo: nextAnnouncementNo,
    previewAnnouncement: previewAnnouncement, announceBatch: announceBatch,
    portfolio: portfolio, verdictOf: verdictOf
  };
})(window.RGMS);

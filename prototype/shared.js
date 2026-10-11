/* =========================================================================
   shared.js — RGMS (ระบบบริหารจัดการทุนวิจัย มฟล.) prototype v1
   - ข้อมูลจำลอง (mock) โครงการทุนงบมหาวิทยาลัย ครอบวงจร 6 ระยะ
   - App shell แบบ role-based (นักวิจัย / เจ้าหน้าที่ / ผู้ทรงคุณวุฒิ / ผู้บริหาร)
   - Helper: badge สถานะ, format เงิน/วันที่, timeline, toast, modal, localStorage state
   ทุกหน้าโหลดไฟล์นี้ แล้วเรียก RGMS.renderAppNav('<pageId>')
   ========================================================================= */
(function (global) {
  "use strict";

  /* -----------------------------------------------------------------------
     บทบาทผู้ใช้ (roles) — สลับได้ที่ index.html (โหมดสาธิต)
     ----------------------------------------------------------------------- */
  var ROLES = {
    researcher: { id: "researcher", label: "นักวิจัย (หัวหน้าโครงการ)", name: "ผศ.ดร.นภัส วงศ์ประเสริฐ", short: "นว", home: "researcher-home.html" },
    chair:      { id: "chair",      label: "ประธานวิจัยสำนักวิชา / คณบดี", name: "รศ.ดร.อาคม ผลานุสนธิ์", short: "ปธ", home: "chair-review.html", school: null },
    secretary:  { id: "secretary",  label: "เลขาสำนักวิชา", name: "คุณเบญจวรรณ ทิพย์วงศ์", short: "ลข", home: "secretary-home.html", school: null },
    staff:      { id: "staff",      label: "เจ้าหน้าที่ส่วนบริหารงานวิจัย", name: "คุณกมลชนก อินทร์แก้ว", short: "จท", home: "staff-queue.html" },
    reviewer:   { id: "reviewer",   label: "คณะอนุกรรมการ (แทร็กเนื้อหา)", name: "รศ.ดร.สุเมธ ธำรงชัย", short: "กก", home: "reviewer-list.html" },
    finance:    { id: "finance",    label: "เจ้าหน้าที่การเงิน (แทร็กการเงิน)", name: "คุณรัตน์ติการณ์ หลวงใจ", short: "กง", home: "finance-review-queue.html" },
    exec:       { id: "exec",       label: "ผู้บริหาร / คกก.ส่งเสริม", name: "รศ.ดร.อรวรรณ สีหราช", short: "ผบ", home: "staff-agenda.html" }
  };
  /* เจ้าหน้าที่การเงิน 2–3 คน — ทำงานแบบ claim (ใครหยิบตรวจก่อน = ผู้รับผิดชอบโครงการนั้นต่อเนื่อง) — FR-83 */
  var FINANCE_REVIEWERS = ["คุณรัตน์ติการณ์ หลวงใจ", "คุณปวีณ์นุช ดวงมณี", "คุณเอกชัย ทองสุข"];
  /* สำนักวิชาที่ประธานวิจัย/เลขา รับผิดชอบ (โหมดสาธิต — ผูกกับสำนักวิชาเทคโนโลยีสารสนเทศ) */
  var SCHOOL_OF_ROLE = "สำนักวิชาเทคโนโลยีสารสนเทศ";
  ROLES.chair.school = SCHOOL_OF_ROLE; ROLES.secretary.school = SCHOOL_OF_ROLE;

  /* -----------------------------------------------------------------------
     นิยามระยะของวงจรทุน (lifecycle) — mapped จากหมวดเอกสารบนหน้าเว็บ มฟล.
     6 ระยะใหญ่: เปิดรับ → ยื่น → ตรวจ+กลั่นกรอง → ดำเนินโครงการ → ปิดโครงการ → เปลี่ยนแปลง
     ----------------------------------------------------------------------- */
 /* เพิ่มสถานะ endorse และปรับลำดับ Lifecycle ให้ครบ 6 ขั้นตอน */
  var STAGES = {
    draft:      { id: "draft",      label: "ร่างข้อเสนอ", badge: "badge-draft", phase: 2, order: 1 },
    submitted:  { id: "submitted",  label: "ยื่นข้อเสนอโครงการแล้ว", badge: "badge-wait", phase: 3, order: 2 },
    endorse:    { id: "endorse",    label: "รอรับรองระดับสำนักวิชา", badge: "badge-wait", phase: 3, order: 3 },
    screening:  { id: "screening",  label: "เจ้าหน้าที่ตรวจความครบถ้วน", badge: "badge-wait", phase: 3, order: 4 },
    review:     { id: "review",     label: "พิจารณา 2 แทร็ก (เนื้อหา/การเงิน)", badge: "badge-review", phase: 3, order: 5 },
    committee:  { id: "committee",  label: "เข้าวาระ · รอมติกรรมการ", badge: "badge-review", phase: 3, order: 6 },
    revise:     { id: "revise",     label: "ให้ปรับแก้ตามมติ", badge: "badge-revise", phase: 3, order: 6 },
    approved:   { id: "approved",   label: "มติ: อนุมัติ · รอประกาศ", badge: "badge-ok", phase: 3, order: 7 },
    rejected:   { id: "rejected",   label: "มติ: ไม่อนุมัติ", badge: "badge-reject", phase: 3, order: 7 },
    announced:  { id: "announced",  label: "ประกาศผลจัดสรรทุนแล้ว", badge: "badge-ok", phase: 3, order: 8 }
  };

  /* ลำดับ Timeline แสดงผล 6 ขั้นตอนหลัก */
  var TIMELINE_ORDER = ["submitted", "endorse", "screening", "review", "committee", "announced"];

  var SCHOOLS = [
    "สำนักวิชาเทคโนโลยีสารสนเทศ", "สำนักวิชาวิทยาศาสตร์", "สำนักวิชาการจัดการ",
    "สำนักวิชาอุตสาหกรรมเกษตร", "สำนักวิชาแพทยศาสตร์", "สำนักวิชาศิลปศาสตร์"
  ];

  var ROUND = { id: "2568-1", label: "ทุนงบประมาณเงินรายได้ ปีงบประมาณ 2568 (รอบ 1)", deadline: "2567-11-30", fiscalYear: 2568 };

  /* ปีงบประมาณปัจจุบัน (รอบที่เปิดรับล่าสุด) — ใช้เป็นค่าตั้งต้นของ year switcher */
  var CURRENT_FY = 2569;

  /* ประเภททุน (tier) + เพดานงบต่อประเภท — จากประกาศผลจริง (แทนเพดานคงที่ 500k) */
  var TIERS = {
    new:      { id: "new",      label: "ทุนนักวิจัยใหม่",           short: "นักวิจัยใหม่", cap: 100000 },
    dev:      { id: "dev",      label: "ทุนพัฒนานักวิจัย",          short: "พัฒนา",       cap: 200000 },
    strategy: { id: "strategy", label: "ทุนสอดคล้องยุทธศาสตร์",     short: "ยุทธศาสตร์",  cap: 300000 },
    industry: { id: "industry", label: "ทุนต่อยอดสู่ภาคอุตสาหกรรม", short: "ต่อยอด",      cap: 300000 }
  };

  /* -----------------------------------------------------------------------
     คำศัพท์/ตัวเลือกจากแบบฟอร์ม RS-01 (แบบเสนอโครงการวิจัย) — ใช้เป็น dropdown ในหน้ายื่นข้อเสนอ
     ----------------------------------------------------------------------- */
  var RESEARCH_TYPES = [
    "การวิจัยพื้นฐาน (Basic Research)",
    "การวิจัยประยุกต์ (Applied Research)",
    "การวิจัยและพัฒนา (Research & Development)",
    "การวิจัยเชิงปฏิบัติการ (Action Research)"
  ];
  /* ข้อ 2 — ประเด็นยุทธศาสตร์การวิจัย มฟล. (เลือก 1) */
  var STRATEGY_GROUPS = [
    "สอดคล้องกับคุณวุฒิ/สาขาวิชา/ภาระงาน (สำหรับทุนนักวิจัยใหม่)",
    "พัฒนาเศรษฐกิจไทยด้วยเศรษฐกิจสร้างคุณค่าและสร้างสรรค์",
    "ยกระดับสังคมและสิ่งแวดล้อมให้พัฒนาอย่างยั่งยืน",
    "พัฒนาวิทยาศาสตร์ เทคโนโลยี วิจัยและนวัตกรรมขั้นแนวหน้า",
    "พัฒนากำลังคนและสถาบันด้าน ววน.",
    "เพิ่มขีดความสามารถการแข่งขัน (ทุนต่อยอดสู่ภาคอุตสาหกรรม)"
  ];
  /* ข้อ 16 — ระดับการถ่ายทอดสู่สังคม */
  var TRANSFER_LEVELS = [
    "ถ่ายทอดเป็นต้นแบบ/แนวทางระดับภูมิภาค ประเทศ หรือนานาชาติ",
    "ถ่ายทอดเป็นต้นแบบ/แนวทางเฉพาะกลุ่มอาชีพ ชุมชน หรือจังหวัด",
    "ไม่มีการนำไปถ่ายทอดสู่สังคม"
  ];
  /* ข้อ 18 — มาตรฐานการวิจัย (ขับเคลื่อนรายการเอกสารแนบ) */
  var RESEARCH_STANDARDS = [
    { id: "none",   label: "ไม่เข้าข่ายมาตรฐานพิเศษ (ไม่มีมนุษย์ / สัตว์ทดลอง / เทคโนโลยีชีวภาพสมัยใหม่)", cert: null },
    { id: "human",  label: "มีการทำวิจัยในมนุษย์",                cert: "หนังสือรับรองจริยธรรมการวิจัยในมนุษย์ (EC)" },
    { id: "animal", label: "มีการใช้สัตว์ทดลอง",                  cert: "หนังสือรับรองจรรยาบรรณการใช้สัตว์เพื่องานทางวิทยาศาสตร์" },
    { id: "plant",  label: "เก็บ/จัดหา/รวบรวมพันธุ์พืชฯ ตามมาตรา 53", cert: "หนังสือแจ้งตามมาตรา 53 พ.ร.บ.คุ้มครองพันธุ์พืช 2542" }
  ];

  /* ประเด็นประกอบการพิจารณา (แนวทางเชิงคุณภาพ — ไม่ใช่คะแนน; เอกสารจริง มฟล. ไม่มี rubric) ใช้เป็นหัวข้อ comment */
  var CRITERIA = [
    { id: "c1", label: "ความสำคัญและที่มาของปัญหา", max: 20 },
    { id: "c2", label: "ระเบียบวิธีวิจัยและความเป็นไปได้", max: 30 },
    { id: "c3", label: "ผลผลิต/ผลลัพธ์และการนำไปใช้ประโยชน์", max: 25 },
    { id: "c4", label: "ความเหมาะสมของงบประมาณและระยะเวลา", max: 15 },
    { id: "c5", label: "ประสบการณ์คณะผู้วิจัย", max: 10 }
  ];

  /* -----------------------------------------------------------------------
     คลังรายการงบประมาณมาตรฐาน (จาก Sheet2 ของฟอร์ม "17.2 รายละเอียดงบประมาณ" ทุน มฟล. 100,000)
     ใช้เป็น dropdown ให้ผู้วิจัยเลือกแทนพิมพ์เอง → มาตรฐานเดียวกันทั้งระบบ
     ----------------------------------------------------------------------- */
  var BUDGET_CATS = [
    { id: "compensation", label: "หมวดค่าตอบแทน", cap: null, items: [
      "ค่าตอบแทน – นักศึกษาช่วยงานด้านวิชาการ",
      "ค่าตอบแทน – นักศึกษาช่วยงานทั่วไป",
      "ค่าตอบแทน – ผู้ให้ข้อมูล",
      "ค่าตอบแทน – ผู้ให้สัมภาษณ์",
      "ค่าตอบแทน – ผู้ตอบแบบสอบถาม",
      "ค่าตอบแทน – อาสาสมัคร"
    ]},
    { id: "generaluse", label: "หมวดค่าใช้สอย", cap: null, items: [
      "ค่าใช้จ่ายในการจัดประชุม - ค่าอาหารกลางวัน (แนบกำหนดการ)",
      "ค่าใช้จ่ายในการจัดประชุม - ค่าอาหารว่าง (แนบกำหนดการ)",
      "ค่าธรรมเนียมการขอจริยธรรมการวิจัยในมนุษย์",
      "ค่าจ้างเหมาวิเคราะห์ทดสอบทางวิทยาศาสตร์ (แนบ TOR)",
      "ค่าจ้างเหมาวิเคราะห์ทางการแพทย์ (แนบ TOR)",
      "ค่าจ้างเหมาผู้ช่วยเก็บข้อมูลในพื้นที่ (แนบ TOR)",
      "ค่าจ้างเหมาผู้นำทางในพื้นที่ (ล่าม) (แนบ TOR)",
      "ค่าจ้างเหมาถอดเทป (แนบ TOR)",
      "ค่าจ้างเหมาอื่นๆ - ระบุ (แนบ TOR)",
      "ค่าธรรมเนียมการใช้ห้องปฏิบัติการ (แนบอัตราค่าบริการหรือใบเสนอราคา)",
      "ค่าธรรมเนียมเครื่องมือวิเคราะห์ทดสอบ (แนบอัตราค่าบริการหรือใบเสนอราคา)",
      "ค่าธรรมเนียมอื่น - ระบุ (แนบอัตราค่าบริการหรือใบเสนอราคา)",
      "ค่าถ่ายเอกสาร",
      "ค่าจัดทำรูปเล่มรายงานวิจัยฯ"
    ]},
    { id: "travel", label: "หมวดค่าใช้สอย - ค่าเดินทาง", cap: 0.25, items: [
      "ค่ายานพาหนะเครื่องบินอาจารย์",
      "ค่าพาหนะในการเดินทางไปปฏิบัติงาน (รถยนต์ส่วนบุคคล)",
      "ค่าเช่ายานพาหนะรถตู้ (แนบ TOR)",
      "ค่าพาหนะในการเดินทางไปปฏิบัติงาน (Taxi)",
      "ค่าที่พัก",
      "ค่าเบี้ยเลี้ยง (กรณีเดินทางออกนอกพื้นที่จังหวัด)"
    ]},
    { id: "material", label: "หมวดวัสดุ", cap: null, items: [
      "ค่าวัสดุสำนักงาน", "ค่าวัสดุคอมพิวเตอร์", "ค่าวัสดุวิทยาศาสตร์",
      "ค่าวัสดุโปรแกรมคอมพิวเตอร์หรือค่าลิขสิทธิ์โปรแกรมคอมพิวเตอร์ (แนบ TOR)",
      "ค่าวัสดุไฟฟ้าและวิทยุ", "ค่าวัสดุงานบ้านงานครัว", "ค่าวัสดุก่อสร้างและประปา",
      "ค่าวัสดุเชื้อเพลิงและหล่อลื่น", "ค่าวัสดุการเกษตร", "ค่าวัสดุโฆษณาและเผยแพร่",
      "ค่าวัสดุเครื่องแต่งกาย", "ค่าวัสดุกีฬา", "ค่าวัสดุสื่อ/ตำรา/วารสาร",
      "ค่าเวชภัณฑ์ยา", "ค่าเวชภัณฑ์ที่มิใช่ยา", "ค่าบรรจุภัณฑ์", "ค่าวัสดุของที่ระลึก"
    ]},
    { id: "utilities", label: "หมวดสาธารณูปโภค", cap: null, items: [
      "ค่าไปรษณีย์และขนส่ง", "ค่าโทรศัพท์และโทรสารในประเทศ", "ค่าบริการทางอินเตอร์เน็ต"
    ]},
    { id: "durable", label: "หมวดครุภัณฑ์", cap: 0.25, freeText: true, items: [] }
  ];
  /* การแบ่งงวด (tier ทุน 100,000) — ระบบแบ่งอัตโนมัติจากยอดรวมแต่ละรายการ */
  var BUDGET_INSTALLMENTS = [
    { label: "งวดที่ 1", pct: 0.5 }, { label: "งวดที่ 2", pct: 0.4 }, { label: "งวดที่ 3", pct: 0.1 }
  ];
  var BUDGET_CAP_DEFAULT = 100000;
  /* รายการใดต้องแนบเอกสารประกอบ (ตรวจจากชื่อรายการ) */
  function attachNeed(itemName) {
    var s = String(itemName || "");
    if (/แนบ\s*TOR/i.test(s)) return "แนบ TOR";
    if (/ใบเสนอราคา|อัตราค่าบริการ/.test(s)) return "แนบใบเสนอราคา";
    if (/แนบกำหนดการ/.test(s)) return "แนบกำหนดการ";
    return null;
  }

  /* -----------------------------------------------------------------------
     ข้อมูลจำลองโครงการ — กระจายทุกสถานะเพื่อสาธิตทุกหน้าจอ
     ----------------------------------------------------------------------- */
  var PROJECTS = [
    {
      id: "P-2568-014", title: "การพัฒนาแบบจำลองภาษา ModernBERT สำหรับวิเคราะห์รสสัมผัสกาแฟอาราบิกาภาคเหนือ",
      pi: "ผศ.ดร.นภัส วงศ์ประเสริฐ", school: SCHOOLS[0], round: ROUND.id,
      budgetReq: 480000, status: "submitted", submittedAt: "2567-11-18", updatedAt: "2567-11-18",
      abstract: "สร้างชุดคำศัพท์รสสัมผัส (sensory lexicon) และแบบจำลองเชิงความหมายเพื่อจัดกลุ่มหัวข้อรสชาติกาแฟจากบทวิจารณ์",
      duration: "12 เดือน", ownerRole: "researcher",
      budget: [
        { item: "ค่าตอบแทนผู้ช่วยวิจัย", amount: 180000 },
        { item: "ค่าวัสดุ/สารเคมี/ตัวอย่างกาแฟ", amount: 120000 },
        { item: "ค่าประมวลผล GPU/Cloud", amount: 90000 },
        { item: "ค่าเผยแพร่/ตีพิมพ์", amount: 60000 },
        { item: "ค่าใช้สอยอื่น ๆ", amount: 30000 }
      ],
      checklist: [
        { key: "form", label: "แบบฟอร์มข้อเสนอโครงการ (ครบทุกหัวข้อ)", ok: true },
        { key: "budget", label: "ตารางงบประมาณถูกต้อง ไม่เกินเพดาน 500,000 บาท", ok: true, note: "ขอ 480,000 บาท" },
        { key: "cv", label: "ประวัติย่อคณะผู้วิจัย (CV)", ok: true },
        { key: "ethics", label: "หนังสือรับรองจริยธรรมการวิจัย / แบบประเมินความเสี่ยง", ok: false, note: "ยังไม่แนบ — งานวิจัยเกี่ยวกับข้อมูลบทวิจารณ์ ต้องมีแบบประเมิน" },
        { key: "endorse", label: "หนังสือนำส่งจากสำนักวิชา", ok: true }
      ],
      reviewers: [], criteria: CRITERIA,
      history: [
        { at: "2567-11-18 09:42", by: "ผศ.ดร.นภัส วงศ์ประเสริฐ", action: "ยื่นข้อเสนอโครงการเข้าระบบ" }
      ]
    },
    {
      id: "P-2568-011", title: "ระบบสนับสนุนการตัดสินใจเชิงพื้นที่เพื่อการท่องเที่ยวเชิงสุขภาพในจังหวัดเชียงราย",
      pi: "อ.ดร.ธีรภัทร คงสิริ", school: SCHOOLS[2], round: ROUND.id,
      budgetReq: 350000, status: "screening", submittedAt: "2567-11-15", updatedAt: "2567-11-19",
      abstract: "พัฒนาแดชบอร์ดเชิงพื้นที่รวมข้อมูลแหล่งท่องเที่ยวเชิงสุขภาพ เพื่อสนับสนุนการวางแผนของผู้ประกอบการ",
      duration: "12 เดือน", ownerRole: "researcher",
      budget: [
        { item: "ค่าตอบแทนผู้ช่วยวิจัย", amount: 150000 },
        { item: "ค่าเก็บข้อมูลภาคสนาม", amount: 100000 },
        { item: "ค่าพัฒนาระบบ/โฮสติ้ง", amount: 60000 },
        { item: "ค่าใช้สอยอื่น ๆ", amount: 40000 }
      ],
      checklist: [
        { key: "form", label: "แบบฟอร์มข้อเสนอโครงการ (ครบทุกหัวข้อ)", ok: true },
        { key: "budget", label: "ตารางงบประมาณถูกต้อง ไม่เกินเพดาน 500,000 บาท", ok: true, note: "ขอ 350,000 บาท" },
        { key: "cv", label: "ประวัติย่อคณะผู้วิจัย (CV)", ok: true },
        { key: "ethics", label: "หนังสือรับรองจริยธรรมการวิจัย / แบบประเมินความเสี่ยง", ok: true },
        { key: "endorse", label: "หนังสือนำส่งจากสำนักวิชา", ok: true }
      ],
      reviewers: [], criteria: CRITERIA,
      history: [
        { at: "2567-11-15 14:10", by: "อ.ดร.ธีรภัทร คงสิริ", action: "ยื่นข้อเสนอโครงการเข้าระบบ" },
        { at: "2567-11-19 10:05", by: "ระบบ", action: "ตรวจความครบถ้วนอัตโนมัติ: ผ่านทุกรายการ" }
      ]
    },
    {
      id: "P-2568-009", title: "การสังเคราะห์วัสดุดูดซับคาร์บอนจากกากกาแฟเหลือทิ้งด้วยกระบวนการไพโรไลซิส",
      pi: "รศ.ดร.พิมพ์ชนก อารีย์", school: SCHOOLS[1], round: ROUND.id,
      budgetReq: 495000, status: "review", submittedAt: "2567-11-12", updatedAt: "2567-11-22",
      abstract: "ศึกษาสภาวะไพโรไลซิสที่เหมาะสมในการเปลี่ยนกากกาแฟเป็นถ่านกัมมันต์สำหรับดูดซับคาร์บอน",
      duration: "18 เดือน", ownerRole: "researcher",
      budget: [
        { item: "ค่าตอบแทนผู้ช่วยวิจัย", amount: 200000 },
        { item: "ค่าสารเคมี/วัสดุวิทยาศาสตร์", amount: 180000 },
        { item: "ค่าวิเคราะห์ตัวอย่าง (BET/SEM)", amount: 75000 },
        { item: "ค่าใช้สอยอื่น ๆ", amount: 40000 }
      ],
      checklist: [
        { key: "form", label: "แบบฟอร์มข้อเสนอโครงการ (ครบทุกหัวข้อ)", ok: true },
        { key: "budget", label: "ตารางงบประมาณถูกต้อง ไม่เกินเพดาน 500,000 บาท", ok: true, note: "ขอ 495,000 บาท" },
        { key: "cv", label: "ประวัติย่อคณะผู้วิจัย (CV)", ok: true },
        { key: "ethics", label: "แบบประเมินความเสี่ยง/ความปลอดภัยห้องปฏิบัติการ", ok: true },
        { key: "endorse", label: "หนังสือนำส่งจากสำนักวิชา", ok: true }
      ],
      criteria: CRITERIA,
      reviewers: [
        { name: "ผศ.ดร.วรินทร มโนธรรม", submitted: true, total: 80, recommend: "approve", scores: { c1: 16, c2: 25, c3: 20, c4: 11, c5: 8 }, comment: "ระเบียบวิธีชัดเจน ควรระบุแผนการควบคุมคุณภาพถ่านกัมมันต์ให้ละเอียดขึ้น" },
        { name: "รศ.ดร.สุเมธ ธำรงชัย", submitted: false, total: null, recommend: null, scores: {}, comment: "" }
      ],
      history: [
        { at: "2567-11-12 11:20", by: "รศ.ดร.พิมพ์ชนก อารีย์", action: "ยื่นข้อเสนอโครงการเข้าระบบ" },
        { at: "2567-11-16 09:00", by: "คุณกมลชนก อินทร์แก้ว", action: "รับเรื่อง · ตรวจเอกสารครบถ้วน" },
        { at: "2567-11-18 15:30", by: "คุณกมลชนก อินทร์แก้ว", action: "มอบหมายผู้ทรงคุณวุฒิ 2 ท่าน" },
        { at: "2567-11-22 20:14", by: "รศ.ดร.สุเมธ ธำรงชัย", action: "ส่งความเห็น: เห็นควรสนับสนุน (มีข้อเสนอแนะให้ปรับ)" }
      ]
    },
    {
      id: "P-2568-006", title: "แพลตฟอร์มประเมินทักษะดิจิทัลด้วย AI สำหรับหลักสูตรบัณฑิตพันธุ์ใหม่",
      pi: "ผศ.ดร.กานต์ ศิริมงคล", school: SCHOOLS[0], round: ROUND.id,
      budgetReq: 460000, status: "committee", submittedAt: "2567-11-08", updatedAt: "2567-11-24",
      abstract: "สร้างระบบวินิจฉัยช่องว่างทักษะและแนะนำเส้นทางการเรียนรู้เฉพาะบุคคล",
      duration: "12 เดือน", ownerRole: "researcher",
      budget: [
        { item: "ค่าตอบแทนผู้ช่วยวิจัย", amount: 180000 },
        { item: "ค่าพัฒนาระบบ/โมเดล", amount: 160000 },
        { item: "ค่าทดสอบกับผู้ใช้", amount: 70000 },
        { item: "ค่าใช้สอยอื่น ๆ", amount: 50000 }
      ],
      checklist: [
        { key: "form", label: "แบบฟอร์มข้อเสนอโครงการ (ครบทุกหัวข้อ)", ok: true },
        { key: "budget", label: "ตารางงบประมาณถูกต้อง ไม่เกินเพดาน 500,000 บาท", ok: true },
        { key: "cv", label: "ประวัติย่อคณะผู้วิจัย (CV)", ok: true },
        { key: "ethics", label: "หนังสือรับรองจริยธรรมการวิจัยในมนุษย์", ok: true },
        { key: "endorse", label: "หนังสือนำส่งจากสำนักวิชา", ok: true }
      ],
      criteria: CRITERIA,
      reviewers: [
        { name: "รศ.ดร.สุเมธ ธำรงชัย", submitted: true, total: 88, recommend: "approve", scores: { c1: 18, c2: 27, c3: 22, c4: 13, c5: 8 }, comment: "โครงการมีศักยภาพสูง เชื่อมกับหลักสูตรได้จริง" },
        { name: "ผศ.ดร.วรินทร มโนธรรม", submitted: true, total: 82, recommend: "approve_revise", scores: { c1: 16, c2: 25, c3: 20, c4: 13, c5: 8 }, comment: "ควรลดงบค่าพัฒนาระบบลงประมาณ 10% และเพิ่มแผนความยั่งยืน" }
      ],
      meeting: { no: "3/2567", date: "2567-12-04", agendaItem: null, resolution: null },
      history: [
        { at: "2567-11-08 10:00", by: "ผศ.ดร.กานต์ ศิริมงคล", action: "ยื่นข้อเสนอโครงการเข้าระบบ" },
        { at: "2567-11-10 09:30", by: "คุณกมลชนก อินทร์แก้ว", action: "รับเรื่อง · ตรวจเอกสารครบถ้วน" },
        { at: "2567-11-24 16:45", by: "ระบบ", action: "รวบรวมความเห็นคณะอนุกรรมการ 2 ท่าน · พร้อมเข้าวาระ" }
      ]
    },
    {
      id: "P-2568-002", title: "การออกแบบประสบการณ์ผู้ใช้สำหรับระบบสุขภาวะผู้สูงอายุในชุมชน",
      pi: "อ.ดร.ชนิกานต์ พูลสวัสดิ์", school: SCHOOLS[5], round: ROUND.id,
      budgetReq: 300000, status: "revise", submittedAt: "2567-11-05", updatedAt: "2567-12-06",
      abstract: "ศึกษาและออกแบบ UX ของแอปสุขภาวะสำหรับผู้สูงอายุ เน้นการเข้าถึงและความเข้าใจ",
      duration: "10 เดือน", ownerRole: "researcher",
      budget: [
        { item: "ค่าตอบแทนผู้ช่วยวิจัย", amount: 120000 },
        { item: "ค่าเก็บข้อมูลผู้ใช้/ค่าตอบแทนผู้เข้าร่วม", amount: 110000 },
        { item: "ค่าเครื่องมือออกแบบ/ทดสอบ", amount: 40000 },
        { item: "ค่าใช้สอยอื่น ๆ", amount: 30000 }
      ],
      checklist: [
        { key: "form", label: "แบบฟอร์มข้อเสนอโครงการ (ครบทุกหัวข้อ)", ok: true },
        { key: "budget", label: "ตารางงบประมาณถูกต้อง", ok: true },
        { key: "cv", label: "ประวัติย่อคณะผู้วิจัย (CV)", ok: true },
        { key: "ethics", label: "หนังสือรับรองจริยธรรมการวิจัยในมนุษย์", ok: true },
        { key: "endorse", label: "หนังสือนำส่งจากสำนักวิชา", ok: true }
      ],
      criteria: CRITERIA,
      reviewers: [
        { name: "ผศ.ดร.วรินทร มโนธรรม", submitted: true, total: 76, recommend: "approve_revise", scores: { c1: 15, c2: 22, c3: 19, c4: 12, c5: 8 }, comment: "แนวคิดดี แต่ต้องเพิ่มความชัดเจนของขนาดกลุ่มตัวอย่างและเกณฑ์คัดเข้า" }
      ],
      meeting: { no: "3/2567", date: "2567-12-04", agendaItem: "4.2", resolution: "อนุมัติแบบมีเงื่อนไข ให้ปรับแก้ระเบียบวิธีและกลุ่มตัวอย่างภายใน 15 วัน" },
      history: [
        { at: "2567-11-05 13:00", by: "อ.ดร.ชนิกานต์ พูลสวัสดิ์", action: "ยื่นข้อเสนอโครงการเข้าระบบ" },
        { at: "2567-12-04 14:00", by: "ที่ประชุมกรรมการ 3/2567", action: "มติ: อนุมัติแบบมีเงื่อนไข ให้ปรับแก้" },
        { at: "2567-12-06 09:15", by: "คุณกมลชนก อินทร์แก้ว", action: "แจ้งผลและส่งคืนให้ผู้วิจัยปรับแก้" }
      ]
    },
    {
      id: "P-2567-021", title: "การวิเคราะห์เชิงความหมายของบทวิจารณ์ผู้ใช้แอปพลิเคชันสุขภาพด้วย Topic Modeling",
      pi: "ผศ.ดร.นภัส วงศ์ประเสริฐ", school: SCHOOLS[0], round: "2567-1",
      budgetReq: 420000, status: "ongoing", submittedAt: "2566-11-10", updatedAt: "2567-09-01",
      abstract: "จัดกลุ่มหัวข้อความคิดเห็นผู้ใช้เพื่อค้นหา pain point ของแอปสุขภาพ",
      duration: "12 เดือน", ownerRole: "researcher",
      startDate: "2567-02-01", progressPct: 55,
      budget: [
        { item: "ค่าตอบแทนผู้ช่วยวิจัย", amount: 180000 },
        { item: "ค่าประมวลผล/Cloud", amount: 120000 },
        { item: "ค่าเผยแพร่", amount: 70000 },
        { item: "ค่าใช้สอยอื่น ๆ", amount: 50000 }
      ],
      installments: [
        { label: "งวดที่ 1 (50% เมื่อทำสัญญา)", amount: 210000, status: "paid", date: "2567-02-10" },
        { label: "งวดที่ 2 (30% เมื่อส่งรายงานก้าวหน้า)", amount: 126000, status: "due", date: null },
        { label: "งวดที่ 3 (20% เมื่อปิดโครงการ)", amount: 84000, status: "pending", date: null }
      ],
      account: { bank: "ธนาคารกรุงไทย สาขา มฟล.", no: "xxx-x-x4821-x", name: "โครงการวิจัย P-2567-021", opened: "2567-02-05" },
      ledger: {
        received: 210000, spent: 168500,
        byCat: [
          { cat: "ค่าตอบแทนผู้ช่วยวิจัย", budget: 180000, spent: 105000 },
          { cat: "ค่าประมวลผล/Cloud", budget: 120000, spent: 48000 },
          { cat: "ค่าเผยแพร่", budget: 70000, spent: 0 },
          { cat: "ค่าใช้สอยอื่น ๆ", budget: 50000, spent: 15500 }
        ]
      },
      vouchers: [
        { code: "วจ.1/5", label: "ใบสำคัญรับเงิน", n: 14 },
        { code: "วจ.2", label: "ใบรับรองการจ่ายเงิน", n: 9 },
        { code: "วจ.3–4", label: "ขออนุมัติ/รายงานการเดินทาง", n: 2 },
        { code: "วจ.7–8", label: "แบบลงเวลาผู้ช่วยวิจัย", n: 6 },
        { code: "วจ.9", label: "ทะเบียนคุมเงินสดย่อย", n: 1 }
      ],
      checklist: [], criteria: CRITERIA, reviewers: [],
      history: [
        { at: "2567-01-20", by: "ส่วนบริหารงานวิจัย", action: "ลงนามสัญญารับทุน" },
        { at: "2567-02-10", by: "ส่วนการเงิน", action: "เบิกจ่ายงวดที่ 1 (210,000 บาท)" }
      ]
    },
    {
      id: "P-2567-015", title: "การพัฒนาเซนเซอร์ตรวจวัดคุณภาพน้ำต้นทุนต่ำสำหรับเกษตรกรผู้ปลูกกาแฟ",
      pi: "อ.ดร.ณัฐวุฒิ แสนคำ", school: SCHOOLS[3], round: "2567-1",
      budgetReq: 380000, status: "final", submittedAt: "2566-11-02", updatedAt: "2567-09-12",
      abstract: "ออกแบบเซนเซอร์ IoT ต้นทุนต่ำวัดค่า pH/ความขุ่น พร้อมส่งข้อมูลขึ้นคลาวด์",
      duration: "12 เดือน", ownerRole: "researcher",
      startDate: "2566-12-15", progressPct: 100,
      budget: [
        { item: "ค่าตอบแทนผู้ช่วยวิจัย", amount: 150000 },
        { item: "ค่าอุปกรณ์อิเล็กทรอนิกส์", amount: 140000 },
        { item: "ค่าทดสอบภาคสนาม", amount: 50000 },
        { item: "ค่าใช้สอยอื่น ๆ", amount: 40000 }
      ],
      installments: [
        { label: "งวดที่ 1 (50%)", amount: 190000, status: "paid", date: "2566-12-20" },
        { label: "งวดที่ 2 (30%)", amount: 114000, status: "paid", date: "2567-06-05" },
        { label: "งวดที่ 3 (20% เมื่อปิดโครงการ)", amount: 76000, status: "due", date: null }
      ],
      finance: { submitted: true, verified: false, issues: ["ใบเสร็จค่าอุปกรณ์รายการที่ 7 ไม่มีลายมือชื่อผู้รับเงิน", "ยอดรวมหมวดค่าใช้สอยเกินงบที่อนุมัติ 2,300 บาท"] },
      reportFormat: "รูปแบบ 5 บท (ทุนนักวิจัยใหม่)",
      reportReviewers: [
        { name: "ผศ.ดร.วรินทร มโนธรรม", submitted: true, verdict: "revise", comment: "เนื้อหาครบตามรูปแบบ 5 บท แต่บทที่ 4 ควรเพิ่มการอภิปรายผลเทียบกับงานวิจัยเดิม และแก้รูปแบบการอ้างอิงในบรรณานุกรมให้สม่ำเสมอก่อนรับรอง" },
        { name: "รศ.ดร.สุเมธ ธำรงชัย", submitted: false, verdict: null, comment: "" }
      ],
      checklist: [], criteria: CRITERIA, reviewers: [],
      history: [
        { at: "2567-08-30", by: "อ.ดร.ณัฐวุฒิ แสนคำ", action: "ส่งรายงานวิจัยฉบับสมบูรณ์" },
        { at: "2567-09-12", by: "อ.ดร.ณัฐวุฒิ แสนคำ", action: "ส่งเอกสารการเงินงวดสุดท้าย" }
      ]
    },
    {
      id: "P-2566-030", title: "การประเมินความคุ้มค่าของระบบเกษตรแม่นยำในสวนกาแฟขนาดเล็ก",
      pi: "รศ.ดร.พิมพ์ชนก อารีย์", school: SCHOOLS[1], round: "2566-1",
      budgetReq: 450000, status: "closed", submittedAt: "2565-11-01", updatedAt: "2567-03-20",
      abstract: "วิเคราะห์ต้นทุน-ผลตอบแทนของการนำระบบเกษตรแม่นยำมาใช้ในสวนกาแฟ",
      duration: "18 เดือน", ownerRole: "researcher",
      startDate: "2566-01-15", progressPct: 100,
      budget: [
        { item: "ค่าตอบแทนผู้ช่วยวิจัย", amount: 200000 },
        { item: "ค่าอุปกรณ์เซนเซอร์", amount: 150000 },
        { item: "ค่าเก็บข้อมูล", amount: 60000 },
        { item: "ค่าใช้สอยอื่น ๆ", amount: 40000 }
      ],
      installments: [
        { label: "งวดที่ 1 (50%)", amount: 225000, status: "paid", date: "2566-01-25" },
        { label: "งวดที่ 2 (30%)", amount: 135000, status: "paid", date: "2566-10-10" },
        { label: "งวดที่ 3 (20%)", amount: 90000, status: "paid", date: "2567-03-20" }
      ],
      finance: { submitted: true, verified: true, issues: [] },
      output: { publication: "ตีพิมพ์ในวารสาร TCI กลุ่ม 1 จำนวน 1 บทความ", closedDate: "2567-03-20" },
      checklist: [], criteria: CRITERIA, reviewers: [],
      history: [
        { at: "2567-03-01", by: "อ.ดร.ผู้วิจัย", action: "ส่งรายงานฉบับสมบูรณ์ + เอกสารการเงินครบ" },
        { at: "2567-03-18", by: "คุณกมลชนก อินทร์แก้ว", action: "ตรวจเอกสารการเงินผ่าน" },
        { at: "2567-03-20", by: "ส่วนบริหารงานวิจัย", action: "ปิดโครงการสมบูรณ์" }
      ]
    }
  ];

  /* -----------------------------------------------------------------------
     ขยายชุดข้อมูลจำลองให้ครอบ 2 ปีงบ (2569 = รอบปัจจุบัน · 2568 = รอบก่อนที่ยังดำเนินการ/ปิด)
     เพื่อสาธิต year switcher + ภาพ overlap ข้ามปี (รวมกับที่มีอยู่ ≈ 30 โครงการ)
     ใช้ factory เติม field เริ่มต้น (budget/checklist/installments/finance/meeting) ตามสถานะ
     ----------------------------------------------------------------------- */
  function _split(req) {
    var a = Math.round(req * 0.4), b = Math.round(req * 0.3), c = Math.round(req * 0.15), d = req - a - b - c;
    return [
      { item: "ค่าตอบแทนผู้ช่วยวิจัย", amount: a },
      { item: "ค่าวัสดุ/สารเคมี/ดำเนินการ", amount: b },
      { item: "ค่าเก็บข้อมูล/เดินทาง", amount: c },
      { item: "ค่าใช้สอยอื่น ๆ", amount: d }
    ];
  }
  function _checklist(gap) {
    return [
      { key: "form", label: "แบบฟอร์มข้อเสนอโครงการ (ครบทุกหัวข้อ)", ok: true },
      { key: "budget", label: "ตารางงบประมาณถูกต้องตามเพดานประเภททุน", ok: true },
      { key: "cv", label: "ประวัติย่อคณะผู้วิจัย (CV)", ok: true },
      { key: "ethics", label: "ใบรับรองมาตรฐานการวิจัย (EC/Lab/Bio ตามที่เกี่ยวข้อง)", ok: !gap, note: gap ? "ยังไม่แนบใบรับรองมาตรฐาน" : "" },
      { key: "endorse", label: "หนังสือนำส่งจากสำนักวิชา", ok: true }
    ];
  }
  function _installments(req, st) {
    var g1 = Math.round(req * 0.5), g2 = Math.round(req * 0.4), g3 = req - g1 - g2;
    var s = ({ ongoing: ["paid", "due", "pending"], progress: ["paid", "paid", "pending"], final: ["paid", "paid", "due"], financial: ["paid", "paid", "due"], closed: ["paid", "paid", "paid"] })[st] || ["pending", "pending", "pending"];
    return [
      { label: "งวดที่ 1 (50%)", amount: g1, status: s[0], date: null },
      { label: "งวดที่ 2 (40%)", amount: g2, status: s[1], date: null },
      { label: "งวดที่ 3 (10%)", amount: g3, status: s[2], date: null }
    ];
  }
  var _revNames = ["ผศ.ดร.วรินทร มโนธรรม", "รศ.ดร.สุเมธ ธำรงชัย", "ศ.ดร.เทพ เฉลิมชัย", "รศ.ดร.พิมพ์ชนก อารีย์", "ผศ.ดร.ปิยะนาฏ จันทร์กระจ่าง", "ผศ.ดร.กานต์ ศิริมงคล", "รศ.ดร.ฉันทนา แรงสิงห์", "รศ.ดร.ณัฐกานต์ สร้อยกาบแก้ว"];
  function _pickRev(id) { var n = String(id).split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0); return _revNames[n % _revNames.length]; }
  function mkProject(o) {
    var st = o.status;
    var p = Object.assign({
      round: "2569-1", ownerRole: "researcher", duration: "12 เดือน",
      abstract: o.abstract || o.title,
      budget: _split(o.budgetReq),
      checklist: _checklist(o.gap),
      reviewers: [], criteria: CRITERIA,
      updatedAt: o.submittedAt || "",
      history: [{ at: o.submittedAt || "", by: o.pi, action: "ยื่นข้อเสนอโครงการเข้าระบบ" }]
    }, o);
    if (["review", "committee", "revise", "approved", "rejected"].indexOf(st) >= 0 && !p.reviewers.length) {
      var rc = st === "rejected" ? "reject" : (st === "revise" ? "approve_revise" : "approve");
      p.reviewers = [{ name: _pickRev(o.id), submitted: true, total: (o.score || 82), recommend: rc, scores: { c1: 16, c2: 24, c3: 21, c4: 13, c5: 8 }, comment: "ระเบียบวิธีชัดเจน ควรระบุแผนการนำผลไปใช้ให้เป็นรูปธรรมขึ้น" }];
    }
    if (["ongoing", "progress", "final", "financial", "closed"].indexOf(st) >= 0) {
      p.installments = _installments(o.budgetReq, st);
      p.startDate = o.startDate || "2567-12-01";
      p.progressPct = o.progressPct != null ? o.progressPct : (st === "ongoing" ? 40 : st === "progress" ? 70 : 100);
    }
    if (["final", "financial"].indexOf(st) >= 0) p.finance = { submitted: true, verified: false, issues: o.issues || [] };
    if (st === "closed") { p.finance = { submitted: true, verified: true, issues: [] }; p.output = { publication: o.publication || "ตีพิมพ์วารสารระดับชาติ TCI กลุ่ม 1", closedDate: o.closedDate || "2568-03-15" }; }
    if (["committee", "revise", "approved"].indexOf(st) >= 0) p.meeting = { no: o.meetingNo || "1/2569", date: o.meetingDate || "2568-12-04", agendaItem: o.agendaItem || null, resolution: st === "revise" ? "อนุมัติแบบมีเงื่อนไข ให้ปรับแก้ตามข้อสังเกต" : null };
    return p;
  }

  [
    /* ---- ปีงบ 2569 (รอบปัจจุบัน · ระยะต้น) ---- */
    { id: "P-2569-031", title: "การพัฒนาโมเดลทำนายการดื้อยาปฏิชีวนะจากข้อมูลคลินิกด้วย Machine Learning", pi: "อ.ดร.ศุภกร ใจดี", school: SCHOOLS[0], budgetReq: 100000, tier: "new", status: "submitted", submittedAt: "2568-11-10" },
    { id: "P-2569-032", title: "ระบบตรวจจับโรคใบกาแฟด้วยภาพถ่ายและ Vision Transformer", pi: "อ.ดร.พิมพิศา ทองคำ", school: SCHOOLS[0], budgetReq: 100000, tier: "new", status: "submitted", submittedAt: "2568-11-12", gap: true },
    { id: "P-2569-033", title: "การวิเคราะห์อารมณ์รีวิวนักท่องเที่ยวจีนด้วย NLP", pi: "อ.ดร.เหมย หลิน", school: SCHOOLS[2], budgetReq: 95000, tier: "new", status: "submitted", submittedAt: "2568-11-13" },
    { id: "P-2569-034", title: "ฤทธิ์ต้านอนุมูลอิสระของสารสกัดจากเปลือกกาแฟเพื่อเครื่องสำอาง", pi: "อ.สุดารัตน์ เจียมผัน", school: SCHOOLS[1], budgetReq: 100000, tier: "new", status: "submitted", submittedAt: "2568-11-14" },
    { id: "P-2569-035", title: "แพลตฟอร์มติดตามสุขภาวะผู้สูงอายุในชุมชนด้วย IoT", pi: "ผศ.ดร.ธนพล คีรีรัตน์", school: SCHOOLS[4], budgetReq: 200000, tier: "dev", status: "screening", submittedAt: "2568-11-05" },
    { id: "P-2569-036", title: "การพัฒนาชุดทดสอบคุณภาพน้ำภาคสนามต้นทุนต่ำ", pi: "อ.ดร.ณิชา วนาลัย", school: SCHOOLS[3], budgetReq: 150000, tier: "dev", status: "screening", submittedAt: "2568-11-06" },
    { id: "P-2569-037", title: "การจำลองโมเลกุลของสารยับยั้งเอนไซม์มะเร็งเต้านม", pi: "ผศ.ดร.กีรติ สมสวน", school: SCHOOLS[4], budgetReq: 300000, tier: "strategy", status: "review", submittedAt: "2568-11-01", score: 86 },
    { id: "P-2569-038", title: "การยกระดับการท่องเที่ยวเชิงสุขภาพลุ่มน้ำกกอย่างยั่งยืน", pi: "อ.ดร.ปฏิพัทธ์ ตันมิ่ง", school: SCHOOLS[2], budgetReq: 280000, tier: "strategy", status: "review", submittedAt: "2568-11-02", score: 79 },
    { id: "P-2569-039", title: "ModernBERT สำหรับจัดกลุ่มหัวข้อรสชาติกาแฟจากบทวิจารณ์", pi: "อ.ดร.ปรัสรา จักรแก้ว", school: SCHOOLS[0], budgetReq: 100000, tier: "new", status: "review", submittedAt: "2568-11-03", score: 84 },
    { id: "P-2569-040", title: "การพัฒนากระบวนการหมักกาแฟพิเศษด้วยจุลินทรีย์คัดเลือก", pi: "ผศ.ดร.รัฐพล แสงระยับ", school: SCHOOLS[3], budgetReq: 300000, tier: "strategy", status: "committee", submittedAt: "2568-10-28", score: 88 },
    { id: "P-2569-041", title: "วัสดุเคลือบบรรจุภัณฑ์ชีวภาพกันน้ำจากพอลิเมอร์ธรรมชาติ", pi: "รศ.ดร.ณัฐกานต์ สร้อยกาบแก้ว", school: SCHOOLS[1], budgetReq: 300000, tier: "industry", status: "committee", submittedAt: "2568-10-27", score: 85 },
    { id: "P-2569-042", title: "การออกแบบ UX แอปสุขภาพจิตสำหรับนักศึกษา", pi: "อ.ดร.ชนิกานต์ พูลสวัสดิ์", school: SCHOOLS[5], budgetReq: 120000, tier: "dev", status: "revise", submittedAt: "2568-10-20", score: 76 },
    { id: "P-2569-043", title: "ระบบสนับสนุนการตัดสินใจจัดเส้นทางนิเทศฝึกงานด้วย GIS", pi: "อ.ดร.ปวีณา สืบสมบัติ", school: SCHOOLS[0], budgetReq: 99000, tier: "new", status: "approved", submittedAt: "2568-10-15", score: 83 },
    { id: "P-2569-044", title: "การทำนายการลงทะเบียนของนักศึกษาด้วย Machine Learning", pi: "อ.ดร.พัชราภรณ์ พรรณวงค์", school: SCHOOLS[0], budgetReq: 61000, tier: "new", status: "rejected", submittedAt: "2568-10-14", score: 58 },
    /* ---- ปีงบ 2568 (รอบก่อน · กำลังดำเนินการ/ปิด — overlap กับ 2569) ---- */
    { id: "P-2568-051", title: "การพัฒนาเซนเซอร์วัดความชื้นดินสำหรับสวนกาแฟ", pi: "อ.ดร.ณัฐวุฒิ แสนคำ", school: SCHOOLS[3], budgetReq: 200000, tier: "dev", status: "ongoing", round: "2568-1", startDate: "2567-12-01", progressPct: 35 },
    { id: "P-2568-052", title: "การวิเคราะห์เมตาโบโลมิกส์ของกาแฟอาราบิกาภาคเหนือ", pi: "ผศ.ดร.กิติพงษ์ คงพินิจบรรจง", school: SCHOOLS[1], budgetReq: 300000, tier: "strategy", status: "ongoing", round: "2568-1", progressPct: 45 },
    { id: "P-2568-053", title: "แดชบอร์ดข้อมูลสุขภาพชุมชนเชิงพื้นที่", pi: "อ.ดร.ธีรภัทร คงสิริ", school: SCHOOLS[2], budgetReq: 200000, tier: "dev", status: "ongoing", round: "2568-1", progressPct: 55 },
    { id: "P-2568-054", title: "การพัฒนาเจลสมุนไพรรักษาสะเก็ดเงิน", pi: "อ.ดร.สินี ตัณฑสถิตยานนท์", school: SCHOOLS[4], budgetReq: 200000, tier: "dev", status: "progress", round: "2568-1", progressPct: 72 },
    { id: "P-2568-055", title: "การศึกษาความหลากหลายของเห็ดป่าในภาคเหนือ", pi: "อ.ดร.ทัศนีย์ หลวงหาญ", school: SCHOOLS[1], budgetReq: 100000, tier: "new", status: "final", round: "2568-1", progressPct: 100 },
    { id: "P-2568-056", title: "การกำหนดเกณฑ์จุดตัดคะแนน MFU-TEP ตามกรอบ CEFR", pi: "อ.ดร.สิริกร บำรุงกิจ", school: SCHOOLS[5], budgetReq: 120000, tier: "dev", status: "financial", round: "2568-1", progressPct: 100, issues: ["ใบเสร็จค่าจ้างวิเคราะห์ข้อมูลขาดสำเนาบัตรผู้รับจ้าง"] },
    { id: "P-2568-057", title: "การสังเคราะห์วัสดุดูดซับคาร์บอนจากกากกาแฟ", pi: "รศ.ดร.พิมพ์ชนก อารีย์", school: SCHOOLS[1], budgetReq: 100000, tier: "new", status: "closed", round: "2568-1", closedDate: "2568-02-28" },
    { id: "P-2568-058", title: "การพัฒนาตำรับสเปรย์สมุนไพรลดปวดกล้ามเนื้อ", pi: "อ.ดร.จุรีภรณ์ อิ่มพัฒน์", school: SCHOOLS[4], budgetReq: 300000, tier: "strategy", status: "closed", round: "2568-1", closedDate: "2568-03-10", publication: "ตีพิมพ์วารสารนานาชาติ Open Access 1 บทความ" }
  ].forEach(function (o) { PROJECTS.push(mkProject(o)); });

  /* คำขอเปลี่ยนแปลง (ระยะที่ 6 — แบบฟอร์มอื่น ๆ) */
  var CHANGE_REQUESTS = [
    { id: "CR-014", projectId: "P-2567-021", type: "ขอขยายระยะเวลา", detail: "ขอขยายเวลาดำเนินโครงการ 3 เดือน เนื่องจากรอผลการเก็บข้อมูลรอบสอง", status: "wait", at: "2567-08-20" },
    { id: "CR-013", projectId: "P-2567-021", type: "ขอเปลี่ยนแปลงงบประมาณ", detail: "ขอโอนงบค่าเผยแพร่ 20,000 บาท ไปหมวดค่าประมวลผล", status: "ok", at: "2567-06-11" }
  ];

  /* -----------------------------------------------------------------------
     รอบทุนที่เปิดรับ (ระยะที่ 1 — ประกาศ/สถานะเปิดรับ)
     ----------------------------------------------------------------------- */
  var CALLS = [
    { id: "2569-1", fiscalYear: 2569, title: "ทุนงบประมาณเงินรายได้ ปีงบประมาณ 2569 (รอบ 1)", open: "2568-10-01", close: "2568-11-30", cap: 300000, status: "closed_recent", submissions: 14 },
    { id: "2568-1", fiscalYear: 2568, title: "ทุนงบประมาณเงินรายได้ ปีงบประมาณ 2568 (รอบ 1)", open: "2567-10-01", close: "2567-11-30", cap: 300000, status: "closed", submissions: 13 },
    { id: "2570-1", fiscalYear: 2570, title: "ทุนงบประมาณเงินรายได้ ปีงบประมาณ 2570 (รอบ 1)", open: "2569-10-01", close: "2569-11-30", cap: 300000, status: "open", submissions: 0 }
  ];

  /* -----------------------------------------------------------------------
     เจ้าหน้าที่ส่วนบริหารงานวิจัย (แบ่งหน้าที่ย่อยจริงจากสไลด์ชี้แจง) — FR-66/67
     case manager (operations) มีคนเดียวทั้งหน่วยงาน ดูแลภาพรวมทุกโครงการร่วมกัน ไม่แบ่งงานเป็นรายบุคคล
     (ถ้าอนาคตเพิ่มคนก็ทำงานคิวเดียวกันทั้งทีม ไม่ใช่แยกมอบหมายเป็นรายโครงการ) — จึงไม่มี owner/reassign ต่อโครงการ
     ----------------------------------------------------------------------- */
  var STAFF = [
    { id: "s1", name: "คุณกมลชนก อินทร์แก้ว", fn: "operations", fnLabel: "ดำเนินงานวิจัย" },
    { id: "s3", name: "คุณรัตน์ติการณ์ หลวงใจ", fn: "finance", fnLabel: "การเงิน" },
    { id: "s4", name: "คุณศิริทร์ทิพย์ อรินต๊ะทราย", fn: "standards", fnLabel: "มาตรฐานการวิจัย" }
  ];

  /* ทะเบียนผู้ทรงคุณวุฒิ (roster) + สาขา/ความเชี่ยวชาญ — FR-60 */
  var REVIEWERS = [
    { name: "รศ.ดร.สุเมธ ธำรงชัย", school: SCHOOLS[1], expertise: ["วัสดุศาสตร์", "เคมี", "พลังงาน"] },
    { name: "ผศ.ดร.วรินทร มโนธรรม", school: SCHOOLS[0], expertise: ["AI/ML", "วิทยาการข้อมูล", "วิศวกรรมซอฟต์แวร์"] },
    { name: "รศ.ดร.ฉันทนา แรงสิงห์", school: SCHOOLS[4], expertise: ["สุขภาพชุมชน", "การพยาบาล"] },
    { name: "ศ.ดร.เทพ เฉลิมชัย", school: SCHOOLS[4], expertise: ["ชีวเวชศาสตร์", "เภสัชวิทยา"] },
    { name: "รศ.ดร.พิมพ์ชนก อารีย์", school: SCHOOLS[1], expertise: ["สิ่งแวดล้อม", "วัสดุ"] },
    { name: "ผศ.ดร.ปิยะนาฏ จันทร์กระจ่าง", school: SCHOOLS[2], expertise: ["การท่องเที่ยว", "การจัดการ"] },
    { name: "รศ.ดร.ณัฐกานต์ สร้อยกาบแก้ว", school: SCHOOLS[1], expertise: ["พอลิเมอร์", "บรรจุภัณฑ์"] },
    { name: "ผศ.ดร.กานต์ ศิริมงคล", school: SCHOOLS[0], expertise: ["ระบบสารสนเทศ", "การศึกษา"] }
  ];

  /* การประชุมคณะกรรมการส่งเสริมและพัฒนางานวิจัย (entity) + ประวัติมติ — FR-64/65 */
  var MEETINGS = [
    { no: "2/2569", fiscalYear: 2569, date: "2569-02-19", committee: "คณะกรรมการส่งเสริมและพัฒนางานวิจัย", status: "draft", items: [] },
    { no: "1/2569", fiscalYear: 2569, date: "2568-12-04", committee: "คณะกรรมการส่งเสริมและพัฒนางานวิจัย", status: "minuted", items: [
      { projectId: "P-2569-040", resolution: "approve" }, { projectId: "P-2569-041", resolution: "approve" },
      { projectId: "P-2569-042", resolution: "approve_revise" }, { projectId: "P-2569-043", resolution: "approve" },
      { projectId: "P-2569-044", resolution: "reject" }
    ]},
    { no: "4/2568", fiscalYear: 2568, date: "2568-08-20", committee: "คณะกรรมการส่งเสริมและพัฒนางานวิจัย", status: "minuted", items: [
      { projectId: "P-2568-055", resolution: "approve" }, { projectId: "P-2568-056", resolution: "approve" },
      { projectId: "P-2568-057", resolution: "approve" }, { projectId: "P-2568-058", resolution: "approve" }
    ]},
    { no: "3/2568", fiscalYear: 2568, date: "2568-03-12", committee: "คณะกรรมการส่งเสริมและพัฒนางานวิจัย", status: "minuted", items: [
      { projectId: "P-2568-051", resolution: "approve" }, { projectId: "P-2568-052", resolution: "approve" },
      { projectId: "P-2568-053", resolution: "approve" }, { projectId: "P-2568-054", resolution: "approve_revise" }
    ]}
  ];

  /* =======================================================================
     Helpers
     ======================================================================= */
  function fmtMoney(n) { return (n == null ? "-" : Number(n).toLocaleString("th-TH")); }
  function fmtBaht(n) { return "฿ " + fmtMoney(n); }
  function sumBudget(p) { return (p.budget || []).reduce(function (s, b) { return s + b.amount; }, 0); }
  function stageOf(id) { return STAGES[id] || { label: id, badge: "badge-draft" }; }
  function badgeHTML(statusId) {
    var s = stageOf(statusId);
    return '<span class="badge ' + s.badge + '">' + s.label + '</span>';
  }
  function getProject(id) { return PROJECTS.filter(function (p) { return p.id === id; })[0]; }
  function completeness(p) {
    var items = p.checklist || [];
    var pass = items.filter(function (i) { return i.ok; }).length;
    return { pass: pass, total: items.length, allOk: items.length > 0 && pass === items.length };
  }
  function avgScore(p) {
    var subs = (p.reviewers || []).filter(function (r) { return r.submitted && r.total != null; });
    if (!subs.length) return null;
    return Math.round(subs.reduce(function (s, r) { return s + r.total; }, 0) / subs.length);
  }
  function initials(name) {
    var m = String(name).replace(/^(ผศ|รศ|ศ|อ|ดร|นาย|นาง|นางสาว|คุณ)\.?/g, "").trim();
    return m.slice(0, 2);
  }
  /* ปีงบประมาณของโครงการ — derive จาก round ("2569-1" → 2569) */
  function fyOf(p) { var r = (p && p.round) || ""; return parseInt(String(r).split("-")[0], 10) || null; }
  /* ประเภททุน — ใช้ field tier ถ้ามี ไม่งั้นเดาจากเพดานงบ */
  function tierOf(p) {
    if (p && p.tier && TIERS[p.tier]) return TIERS[p.tier];
    var b = (p && p.budgetReq) || 0;
    return b <= 100000 ? TIERS.new : b <= 200000 ? TIERS.dev : TIERS.strategy;
  }
  /* รายการปีงบที่มีข้อมูล เรียงใหม่→เก่า */
  function fiscalYears() {
    var set = {}; PROJECTS.forEach(function (p) { var y = fyOf(p); if (y) set[y] = 1; });
    return Object.keys(set).map(Number).sort(function (a, b) { return b - a; });
  }
  /* รอบการเปิดรับทุน — สถานะเปิด/ปิด (เจ้าหน้าที่คุมได้, persist) — FR-01/02/03 */
  var _CALL_KEY = "rgms_call_status";
  function _callOverrides() { try { return JSON.parse(localStorage.getItem(_CALL_KEY) || "{}"); } catch (e) { return {}; } }
  function callStatus(c) { var ov = _callOverrides(); return ov[c.id] || c.status; }
  function setCallStatus(id, st) { var o = _callOverrides(); o[id] = st; try { localStorage.setItem(_CALL_KEY, JSON.stringify(o)); } catch (e) {} }
  function openCall() { return CALLS.filter(function (c) { return callStatus(c) === "open"; })[0] || null; }

  /* การรับรองระดับสำนักวิชา (ประธานวิจัย/คณบดี) — FR-74 (persist) */
  var _END_KEY = "rgms_endorse";
  function _endorse() { try { return JSON.parse(localStorage.getItem(_END_KEY) || "{}"); } catch (e) { return {}; } }
  function endorseStatus(id) { return _endorse()[id] || "pending"; }   // pending | passed | returned
  function setEndorse(id, st) { var o = _endorse(); o[id] = st; try { localStorage.setItem(_END_KEY, JSON.stringify(o)); } catch (e) {} }

  /* มติ คกก.ส่งเสริม + ประกาศผล — FR-59 (persist, โหมดสาธิต) */
  var _DECISION_KEY = "rgms_decision";
  var _ANNOUNCE_KEY = "rgms_announced";
  function _decisions() { try { return JSON.parse(localStorage.getItem(_DECISION_KEY) || "{}"); } catch (e) { return {}; } }
  function decisionOf(id) { return _decisions()[id] || null; }   // null | "approve" | "reject"
  function setDecision(id, code) { var o = _decisions(); o[id] = code; try { localStorage.setItem(_DECISION_KEY, JSON.stringify(o)); } catch (e) {} }
  function _announced() { try { return JSON.parse(localStorage.getItem(_ANNOUNCE_KEY) || "{}"); } catch (e) { return {}; } }
  function isAnnounced(id) { return !!_announced()[id]; }
  function announce(ids) {
    var o = _announced();
    (ids || []).forEach(function (id) { o[id] = true; });
    try { localStorage.setItem(_ANNOUNCE_KEY, JSON.stringify(o)); } catch (e) {}
  }
  /* สถานะที่ใช้แสดงจริง = สถานะฐาน + มติ/ประกาศที่บันทึกภายหลัง (layer แบบเดียวกับ endorse) */
  function effectiveStatus(p) {
    if (isAnnounced(p.id)) return "announced";
    var d = decisionOf(p.id);
    if (d === "approve") return "approved";
    if (d === "reject") return "rejected";
    return p.status;
  }
  /* -----------------------------------------------------------------------
     พิจารณา 2 แทร็กคู่ขนาน — เนื้อหา (คณะอนุกรรมการ) / การเงิน (จนท.การเงิน, claim-based) — FR-82–85
     แต่ละแทร็กมีสถานะอิสระ: pending (รอตรวจ) / commented (มีข้อคิดเห็น-ต้องแก้) / cleared (รับรองแล้ว)
     seed ค่าเริ่มต้นจากสถานะเดิม/ข้อมูลจำลอง แล้วเก็บ override ลง localStorage เมื่อมีการพิจารณา/ส่งกลับแก้ไขจริง
     ----------------------------------------------------------------------- */
  var TRACK_STATUS = {
    pending:   { id: "pending",   label: "รอตรวจ",                    badge: "badge-wait" },
    commented: { id: "commented", label: "มีข้อคิดเห็น · ต้องแก้ไข", badge: "badge-revise" },
    cleared:   { id: "cleared",   label: "รับรองแล้ว",                badge: "badge-ok" }
  };
  function trackBadgeHTML(st) { var s = TRACK_STATUS[st] || TRACK_STATUS.pending; return '<span class="badge ' + s.badge + '">' + s.label + '</span>'; }
  /* โครงการอยู่ในช่วงพิจารณา 2 แทร็ก (รวม revise loop ที่ยังวนอยู่ในขั้นเดียวกัน) */
  function inReviewPhase(status) { return status === "review" || status === "revise"; }

  var _CONTENT_TRACK_KEY = "rgms_track_content";
  var _FINANCE_TRACK_KEY = "rgms_track_finance";
  var _FINANCE_OWNER_KEY = "rgms_finance_owner";
  var _CONTENT_COMMENT_KEY = "rgms_content_comment";
  var _FINANCE_COMMENT_KEY = "rgms_finance_comment";
  function _store(key) { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { return {}; } }
  function _persist(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {} }

  /* ค่าเริ่มต้นแทร็กเนื้อหา — สถานะเดิม (committee ขึ้นไป = ผ่านแล้วภายใต้โมเดลเดิม), status review ดูจาก reviewers ที่มีอยู่ */
  function defaultContentStatus(p) {
    if (["committee", "revise", "approved", "rejected", "announced"].indexOf(p.status) >= 0) return "cleared";
    if (p.status === "review") {
      var subs = (p.reviewers || []).filter(function (r) { return r.submitted; });
      if (!subs.length) return "pending";
      if (subs.some(function (r) { return r.recommend === "approve_revise" || r.recommend === "reject"; })) return "commented";
      return "cleared";
    }
    return "pending";
  }
  /* ค่าเริ่มต้นแทร็กการเงิน — โครงการที่เคยผ่านไปถึง committee ขึ้นไปภายใต้โมเดลเดิม ถือว่าการเงินผ่านแล้วด้วย (backward-compat)
     ส่วนโครงการที่ยัง status = review ให้กระจายสถานะแบบ deterministic (จาก id) เพื่อสาธิตแทร็กคู่ขนานที่ไม่ตรงกัน */
  function defaultFinanceStatus(p) {
    if (["committee", "revise", "approved", "rejected", "announced"].indexOf(p.status) >= 0) return "cleared";
    if (p.status === "review") {
      var n = String(p.id).split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
      return ["pending", "commented", "cleared"][n % 3];
    }
    return "pending";
  }
  function contentTrackStatus(id) {
    var p = getProject(id); if (!p) return "pending";
    return _store(_CONTENT_TRACK_KEY)[id] || defaultContentStatus(p);
  }
  function setContentTrackStatus(id, st) { var o = _store(_CONTENT_TRACK_KEY); o[id] = st; _persist(_CONTENT_TRACK_KEY, o); }
  function financeTrackStatus(id) {
    var p = getProject(id); if (!p) return "pending";
    return _store(_FINANCE_TRACK_KEY)[id] || defaultFinanceStatus(p);
  }
  function setFinanceTrackStatus(id, st) { var o = _store(_FINANCE_TRACK_KEY); o[id] = st; _persist(_FINANCE_TRACK_KEY, o); }
  function contentComment(id) { return _store(_CONTENT_COMMENT_KEY)[id] || ""; }
  function setContentComment(id, text) { var o = _store(_CONTENT_COMMENT_KEY); o[id] = text; _persist(_CONTENT_COMMENT_KEY, o); }
  function financeComment(id) { return _store(_FINANCE_COMMENT_KEY)[id] || ""; }
  function setFinanceComment(id, text) { var o = _store(_FINANCE_COMMENT_KEY); o[id] = text; _persist(_FINANCE_COMMENT_KEY, o); }

  /* claim การเงิน — คนแรกที่ claim ผูกเป็นเจ้าของแทร็กการเงินของโครงการนั้นต่อเนื่องทุกรอบ (FR-83)
     seed เจ้าของเริ่มต้นแบบ deterministic ให้กับโครงการที่แทร็กการเงินเริ่มไม่ใช่ pending (ต้องมีคนตรวจแล้วในข้อมูลจำลอง) */
  function financeOwnerOf(id) {
    var ov = _store(_FINANCE_OWNER_KEY)[id];
    if (ov) return ov;
    var p = getProject(id);
    if (p && defaultFinanceStatus(p) !== "pending") {
      var n = String(id).split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
      return FINANCE_REVIEWERS[n % FINANCE_REVIEWERS.length];
    }
    return null;
  }
  function claimFinance(id, name) {
    var existing = financeOwnerOf(id);
    if (existing) return existing;                    // claim ครั้งแรกเท่านั้นที่ผูกเจ้าของได้ — กัน race/แย่งกันตรวจซ้ำ
    var o = _store(_FINANCE_OWNER_KEY); o[id] = name; _persist(_FINANCE_OWNER_KEY, o);
    return name;
  }
  /* มอบหมาย/เปลี่ยนผู้รับผิดชอบแทร็กการเงินด้วยมือ (bypass กติกา claim ครั้งแรก) — ใช้ตอนสลับงานกันเองระหว่าง จนท.การเงิน 2-3 คน */
  function setFinanceOwner(id, name) { var o = _store(_FINANCE_OWNER_KEY); o[id] = name; _persist(_FINANCE_OWNER_KEY, o); }
  /* ภาระงานของ จนท.การเงินแต่ละคน — นับโครงการที่ถือแทร็กการเงินอยู่ในช่วงพิจารณา (ใช้ประกอบการเลือกตอนย้ายมือ) */
  function financeLoad(name) {
    return PROJECTS.filter(function (p) { return inReviewPhase(p.status) && financeOwnerOf(p.id) === name; }).length;
  }
  function bothTracksCleared(id) { return contentTrackStatus(id) === "cleared" && financeTrackStatus(id) === "cleared"; }
  /* ส่งฉบับปรับแก้ — อัตโนมัติ ไม่ให้นักวิจัยเลือกแทร็กเอง (FR-84 ฉบับแก้ไข 2026-09-22):
     แทร็กที่ "รับรองแล้ว" (cleared) จะถูก "ล็อก" ไว้ถาวร ไม่ส่งกลับไปตรวจซ้ำอีกไม่ว่าจะแก้ไขอะไรในรอบถัดไป
     แทร็กที่ยังมีข้อคิดเห็นค้างอยู่ (ไม่ cleared) จะถูกส่งกลับไป pending ให้ผู้ตรวจแทร็กนั้นดูใหม่โดยอัตโนมัติทุกครั้งที่ส่งฉบับแก้ไข
     คืนค่าสรุปว่าแทร็กไหนถูกส่งตรวจซ้ำ/แทร็กไหนล็อกไว้ ไว้ใช้แสดงผลอย่างเดียว (ไม่ใช่ input ของผู้ใช้) */
  function resubmitTracks(id) {
    var result = {};
    ["content", "finance"].forEach(function (t) {
      var cur = t === "content" ? contentTrackStatus(id) : financeTrackStatus(id);
      if (cur === "cleared") { result[t] = "locked"; return; }
      if (t === "content") setContentTrackStatus(id, "pending"); else setFinanceTrackStatus(id, "pending");
      result[t] = "resent";
    });
    return result;
  }
  function budgetTableHTML(p) {
    var total = sumBudget(p) || p.budgetReq;
    return '<div class="table-wrap" style="border-radius:6px;"><table class="table" style="min-width:auto;"><tbody>' +
      (p.budget || []).map(function (b) { return '<tr><td>' + b.item + '</td><td class="right num">' + fmtMoney(b.amount) + '</td></tr>'; }).join("") +
      '<tr><td style="font-weight:700;">รวม</td><td class="right num" style="font-weight:700;">' + fmtMoney(total) + '</td></tr>' +
      '</tbody></table></div>';
  }

  /* ภาระงานผู้ทรง — FR-63: นับโครงการที่ผู้ทรงท่านนี้ถูกมอบหมาย (ประเมินข้อเสนอ + พิจารณาเล่ม) */
  function reviewerLoad(name) {
    return PROJECTS.filter(function (p) {
      return (p.reviewers || []).some(function (r) { return r.name === name; }) ||
             (p.reportReviewers || []).some(function (r) { return r.name === name; });
    }).length;
  }
  /* คำสำคัญของแต่ละความเชี่ยวชาญ — ใช้จับคู่ผู้ทรง ↔ โครงการ (ตัวช่วยแนะนำ FR-60) */
  var EXPERTISE_KEYWORDS = {
    "AI/ML": ["ai", "ml", "machine learning", "modernbert", "nlp", "โมเดล", "ทำนาย", "ตรวจจับ", "vision", "จำแนก", "เรียนรู้"],
    "วิทยาการข้อมูล": ["ข้อมูล", "วิเคราะห์", "dashboard", "แดชบอร์ด", "topic", "คลัสเตอร์", "อารมณ์"],
    "วิศวกรรมซอฟต์แวร์": ["ระบบ", "แพลตฟอร์ม", "แอป", "gis", "สนับสนุนการตัดสินใจ", "iot", "เซนเซอร์"],
    "ระบบสารสนเทศ": ["ระบบ", "สารสนเทศ", "แพลตฟอร์ม", "ดิจิทัล", "ลงทะเบียน"],
    "การศึกษา": ["นักศึกษา", "การเรียน", "ทักษะ", "cefr", "ภาษา", "สมรรถนะ", "หลักสูตร"],
    "วัสดุศาสตร์": ["วัสดุ", "สังเคราะห์", "ดูดซับ", "ถ่าน", "คาร์บอน", "ไพโรไลซิส"],
    "วัสดุ": ["วัสดุ", "สังเคราะห์", "ดูดซับ", "เคลือบ"],
    "เคมี": ["เคมี", "สารสกัด", "องค์ประกอบ", "สังเคราะห์"],
    "พลังงาน": ["พลังงาน", "เชื้อเพลิง"],
    "สิ่งแวดล้อม": ["สิ่งแวดล้อม", "น้ำ", "คาร์บอน", "ของเสีย", "กาก"],
    "พอลิเมอร์": ["พอลิเมอร์", "เคลือบ", "ฟิล์ม", "บรรจุภัณฑ์", "ชีวภาพ"],
    "บรรจุภัณฑ์": ["บรรจุภัณฑ์", "เคลือบ", "กันซึม", "กันน้ำ"],
    "ชีวเวชศาสตร์": ["มะเร็ง", "เซลล์", "โปรตีน", "เอนไซม์", "โมเลกุล", "ยีน", "ชีว"],
    "เภสัชวิทยา": ["ยา", "สมุนไพร", "สารสกัด", "เจล", "สเปรย์", "ครีม", "ฤทธิ์", "ตำรับ"],
    "สุขภาพชุมชน": ["สุขภาพ", "ชุมชน", "ผู้สูงอายุ", "โภชนาการ", "สุขภาวะ"],
    "การพยาบาล": ["พยาบาล", "ผู้ป่วย", "ดูแล", "คลินิก", "ทำคลอด"],
    "การท่องเที่ยว": ["ท่องเที่ยว", "นักท่องเที่ยว", "โรงแรม", "คาเฟ่", "เที่ยว"],
    "การจัดการ": ["ธุรกิจ", "การจัดการ", "ตลาด", "ผู้ประกอบการ", "กลยุทธ์", "บริหาร"]
  };
  /* ตัวช่วยแนะนำผู้ทรง — จัดอันดับ: ไม่มี COI ก่อน → match มากก่อน → ภาระงานน้อยก่อน (FR-60/61/63) */
  function suggestReviewers(p) {
    var text = ((p.title || "") + " " + (p.abstract || "")).toLowerCase();
    return REVIEWERS.map(function (r) {
      var matched = {};
      r.expertise.forEach(function (e) {
        (EXPERTISE_KEYWORDS[e] || []).forEach(function (kw) { if (text.indexOf(kw) >= 0) matched[kw] = 1; });
      });
      var m = Object.keys(matched);
      return { name: r.name, school: r.school, expertise: r.expertise, coi: (r.school === p.school), load: reviewerLoad(r.name), score: m.length, matched: m };
    }).sort(function (a, b) {
      if (a.coi !== b.coi) return a.coi ? 1 : -1;
      if (b.score !== a.score) return b.score - a.score;
      return a.load - b.load;
    });
  }
  var RESOLUTION = { approve: "อนุมัติ", approve_revise: "อนุมัติแบบมีเงื่อนไข", defer: "ให้ชี้แจงเพิ่มเติม", reject: "ไม่อนุมัติ" };
  function resolutionBadge(code) {
    var m = { approve: "badge-ok", approve_revise: "badge-revise", defer: "badge-wait", reject: "badge-reject" };
    return '<span class="badge ' + (m[code] || "badge-draft") + '">' + (RESOLUTION[code] || code) + '</span>';
  }

  /* -------- role state (localStorage, โหมดสาธิต) -------- */
  var ROLE_KEY = "rgms_role";
  function currentRole() {
    var id = null;
    try { id = localStorage.getItem(ROLE_KEY); } catch (e) {}
    return ROLES[id] || ROLES.researcher;
  }
  function setRole(id) { try { localStorage.setItem(ROLE_KEY, id); } catch (e) {} }

  /* -----------------------------------------------------------------------
     โปรไฟล์นักวิจัย (RS-01 ส่วน ข + ข้อมูลติดต่อหัวหน้าโครงการ ข้อ 1.1)
     กรอกครั้งเดียว → ดึงมาใส่ทุกข้อเสนอโดยอัตโนมัติ · แก้ไข/อัปเดตได้ (persist localStorage)
     ----------------------------------------------------------------------- */
  var _PROFILE_KEY = "rgms_profile";
  var PROFILE_FIELDS = [
    // ข้อมูลติดต่อ (RS-01 ข้อ 1.1) + ประวัติ (ส่วน ข)
    { key: "nameTh",   label: "ชื่อ-สกุล (ภาษาไทย)",          group: "identity", type: "text",  required: true },
    { key: "nameEn",   label: "ชื่อ-สกุล (ภาษาอังกฤษ)",       group: "identity", type: "text" },
    { key: "position", label: "ตำแหน่งทางวิชาการ",             group: "identity", type: "text" },
    { key: "school",   label: "สังกัดหน่วยงาน / สำนักวิชา",    group: "identity", type: "school", required: true },
    { key: "phone",    label: "เบอร์โทรศัพท์ที่ติดต่อได้",      group: "identity", type: "text" },
    { key: "email",    label: "E-mail",                        group: "identity", type: "text",  required: true },
    { key: "natId",    label: "รหัสประจำตัวนักวิจัยแห่งชาติ (ถ้ามี)", group: "identity", type: "text" },
    { key: "expertise",     label: "สาขาวิชาการที่มีความชำนาญพิเศษ", group: "academic", type: "area" },
    { key: "education",     label: "ประวัติการศึกษา",           group: "academic", type: "area" },
    { key: "work",          label: "ประวัติการทำงาน",           group: "academic", type: "area" },
    { key: "publications",  label: "ประวัติการเผยแพร่ผลงานวิจัย (ชื่อเรื่อง/วารสาร ตามระบบสากล)", group: "portfolio", type: "area" },
    { key: "presentations", label: "ประวัติการนำเสนอผลงานวิจัย (ชื่อเรื่อง/การประชุม/สถานที่/ปี)",  group: "portfolio", type: "area" },
    { key: "ip",            label: "ทรัพย์สินทางปัญญา (จดแล้ว/อยู่ระหว่างยื่น)", group: "portfolio", type: "area" },
    { key: "adminExp",      label: "ประสบการณ์การบริหารงานวิจัย", group: "portfolio", type: "area" },
    { key: "doneResearch",  label: "งานวิจัยที่ทำเสร็จแล้ว (ชื่อ/สัดส่วน %/แหล่งทุน/ปี/การเผยแพร่)", group: "portfolio", type: "area" },
    { key: "currentResearch", label: "งานวิจัยที่กำลังทำ (ชื่อ/สัดส่วน %/แหล่งทุน/ปี/สถานภาพ)",   group: "portfolio", type: "area" }
  ];
  /* ค่าตัวอย่างเริ่มต้น (โหมดสาธิต) — ให้หน้ายื่นข้อเสนอมีข้อมูลหัวหน้าโครงการทันที */
  var PROFILE_DEFAULT = {
    nameTh: "ผศ.ดร.นภัส วงศ์ประเสริฐ", nameEn: "Asst. Prof. Dr. Napat Wongprasert",
    position: "ผู้ช่วยศาสตราจารย์", school: SCHOOLS[0],
    phone: "081-234-5678", email: "napat.won@mfu.ac.th", natId: "",
    expertise: "วิศวกรรมซอฟต์แวร์, การประมวลผลภาษาธรรมชาติ (NLP), การเรียนรู้ของเครื่อง",
    education: "ปร.ด. (วิศวกรรมคอมพิวเตอร์) จุฬาลงกรณ์มหาวิทยาลัย, 2560\nวศ.ม. (วิศวกรรมคอมพิวเตอร์) ม.เกษตรศาสตร์, 2555",
    work: "2560–ปัจจุบัน อาจารย์/ผู้ช่วยศาสตราจารย์ สำนักวิชาเทคโนโลยีสารสนเทศ มฟล.",
    publications: "", presentations: "", ip: "", adminExp: "",
    doneResearch: "", currentResearch: "", updatedAt: null
  };
  function getProfile() {
    try { var s = JSON.parse(localStorage.getItem(_PROFILE_KEY) || "null"); if (s) return Object.assign({}, PROFILE_DEFAULT, s); } catch (e) {}
    return Object.assign({}, PROFILE_DEFAULT);
  }
  function saveProfile(patch) {
    var merged = Object.assign(getProfile(), patch || {}, { updatedAt: new Date().toISOString() });
    try { localStorage.setItem(_PROFILE_KEY, JSON.stringify(merged)); } catch (e) {}
    return merged;
  }
  function profileSaved() { try { return !!localStorage.getItem(_PROFILE_KEY); } catch (e) { return false; } }

  /* =======================================================================
     App navigation shell (role-based)
     ======================================================================= */
  var NAV = {
    researcher: [
      { group: "งานของฉัน", items: [
        { id: "researcher-home", href: "researcher-home.html", label: "หน้าหลัก / โครงการของฉัน" },
        { id: "proposal-new", href: "proposal-new.html", label: "ยื่นข้อเสนอใหม่" },
        { id: "researcher-profile", href: "researcher-profile.html", label: "โปรไฟล์นักวิจัย" }
      ]}
    ],
    chair: [
      { group: "สำนักวิชา", items: [
        { id: "chair-review", href: "chair-review.html", label: "รับรองข้อเสนอ (สำนักวิชา)", count: 2 }
      ]}
    ],
    secretary: [
      { group: "สำนักวิชา", items: [
        { id: "secretary-home", href: "secretary-home.html", label: "ภาพรวมสำนักวิชา" }
      ]}
    ],
    staff: [
      { group: "ดำเนินการ", items: [
        { id: "staff-queue", href: "staff-queue.html", label: "กล่องงาน · ตรวจเอกสาร", count: 2 },
        { id: "staff-agenda", href: "staff-agenda.html", label: "มติ / ประกาศผล", count: 2 }
      ]},
      { group: "จัดการ", items: [
        { id: "staff-calls", href: "staff-calls.html", label: "เปิดรับทุน / รอบทุน" }
      ]}
    ],
    reviewer: [
      { group: "การประเมิน", items: [
        { id: "reviewer-list", href: "reviewer-list.html", label: "พิจารณาเนื้อหา (แทร็กเนื้อหา)", count: 1 }
      ]}
    ],
    finance: [
      { group: "แทร็กการเงิน", items: [
        { id: "finance-review-queue", href: "finance-review-queue.html", label: "คิวตรวจการเงิน / รับตรวจ" }
      ]}
    ],
    exec: [
      { group: "คกก.ส่งเสริม", items: [
        { id: "staff-agenda", href: "staff-agenda.html", label: "มติ / ประกาศผล" }
      ]}
    ]
  };

function renderAppNav(pageId) {
    var mount = document.getElementById("app-nav-root");
    if (!mount) return;

    // 1. Auto-Sync Role ให้ตรงกับหน้าปัจจุบันเมื่อเปิดข้ามหน้าตรงๆ
    var PAGE_ROLE_MAP = {
      "researcher-home": "researcher",
      "proposal-new": "researcher",
      "researcher-profile": "researcher",
      "chair-review": "chair",
      "secretary-home": "secretary",
      "staff-queue": "staff",
      "staff-calls": "staff",
      "staff-agenda": "exec",
      "reviewer-list": "reviewer",
      "finance-review-queue": "finance"
    };

    var expectedRole = PAGE_ROLE_MAP[pageId];
    if (expectedRole && currentRole().id !== expectedRole) {
      setRole(expectedRole);
    }

    var role = currentRole();
    var groups = NAV[role.id] || [];

    // 2. วาด Sidebar ตาม Role ปัจจุบัน
    var html = '<aside class="app-sidebar">';
    html += '<a class="app-sidebar__brand" href="' + role.home + '">' +
              '<span class="app-sidebar__brand-name">RGMS · ทุนวิจัย มฟล.</span>' +
              '<span class="app-sidebar__brand-sub">ระบบบริหารจัดการทุนงบมหาวิทยาลัย</span>' +
            '</a>';
    html += '<nav class="app-sidebar__nav">';
    groups.forEach(function (g) {
      html += '<div class="app-sidebar__group"><span class="app-sidebar__group-label">' + g.group + '</span></div>';
      g.items.forEach(function (it) {
        var active = it.id === pageId ? " is-active" : "";
        var count = it.count ? '<span class="tag-count">' + it.count + '</span>' : "";
        html += '<a class="app-sidebar__link' + active + '" href="' + it.href + '">' + it.label + count + '</a>';
      });
    });
    html += '</nav>';
    html += '<div class="app-sidebar__footer">' +
              '<div class="app-sidebar__user">' +
                '<span class="avatar avatar--sm">' + role.short + '</span>' +
                '<span class="app-sidebar__user-meta">' +
                  '<span class="app-sidebar__user-name">' + role.name + '</span>' +
                  '<span class="app-sidebar__user-role">' + role.label + '</span>' +
                '</span>' +
              '</div>' +
              '<div style="margin-top:10px;">' +
                '<label style="display:block; font-size:11px; color:#A0AEC0; margin-bottom:4px;">สลับบทบาททดสอบ:</label>' +
                '<select class="field__control" style="width:100%; font-size:12px; padding:6px; background:#2A2A34; color:#FFFFFF; border:1px solid #3F3F4E; border-radius:6px;" onchange="RGMS.switchRole(this.value)">' +
                  Object.keys(ROLES).map(function(k) {
                    return '<option value="' + k + '"' + (k === role.id ? ' selected' : '') + '>' + ROLES[k].label + '</option>';
                  }).join('') +
                '</select>' +
              '</div>' +
            '</div>';
    html += '</aside>';

    mount.innerHTML = html;
    document.body.classList.add("has-sidebar");
  }
  /* -------- toast -------- */
  function toast(msg, kind) {
    var wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    var t = document.createElement("div");
    t.className = "toast" + (kind ? " toast--" + kind : "");
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  /* -------- modal -------- */
  function modal(opts) {
    var back = document.createElement("div");
    back.className = "modal-backdrop";
    back.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
        '<div class="modal__head"><h3 class="text-subhead">' + opts.title + '</h3>' +
          '<button class="btn btn-ghost btn-sm" data-close aria-label="ปิด">ปิด ✕</button></div>' +
        '<div class="modal__body">' + opts.body + '</div>' +
        (opts.foot ? '<div class="modal__foot">' + opts.foot + '</div>' : '') +
      '</div>';
    function close() { back.remove(); }
    back.addEventListener("click", function (e) {
      if (e.target === back || e.target.hasAttribute("data-close")) close();
    });
    document.body.appendChild(back);
    if (opts.onMount) opts.onMount(back, close);
    return { el: back, close: close };
  }

  /* timeline HTML สำหรับหน้ารายละเอียดโครงการ
     แสดง milestone หลักตาม TIMELINE_ORDER; สถานะพิเศษ (revise) แมปกลับไป committee,
     (progress) แมปไป ongoing, (financial) แมปไป final เพื่อระบุ "ขั้นปัจจุบัน" */
function timelineHTML(p) {
    var statusMap = { revise: "committee", rejected: "committee" };
    var raw = effectiveStatus(p);
    var effective = statusMap[raw] || raw;

    // คำนวณสเต็ปจริงร่วมกับสถานะ Endorse ของสำนักวิชา
    if (raw === "submitted") {
      var endSt = endorseStatus(p.id);
      if (endSt === "pending") effective = "endorse";
      else if (endSt === "passed") effective = "screening";
    }

    var curOrder = stageOf(effective).order || 0;
    var html = '<div class="timeline">';
    TIMELINE_ORDER.forEach(function (sid, i) {
      var s = stageOf(sid);
      var cls, mark;
      if (s.order < curOrder) { cls = " timeline__step--done"; mark = "✓"; }
      else if (s.order === curOrder) { cls = " timeline__step--current"; mark = String(i + 1); }
      else { cls = ""; mark = String(i + 1); }

      // แสดงรายละเอียด Sub-status 2 แทร็กในขั้นตอน review
      var subInfo = "";
      if (sid === "review" && (effective === "review" || curOrder >= stageOf("review").order)) {
        var cSt = contentTrackStatus(p.id);
        var fSt = financeTrackStatus(p.id);
        subInfo = '<div class="cluster gap-1" style="margin-top:6px; font-size:11px;">' +
                    '<span>เนื้อหา: ' + trackBadgeHTML(cSt) + '</span> ' +
                    '<span>การเงิน: ' + trackBadgeHTML(fSt) + '</span>' +
                  '</div>';
      }

      html += '<div class="timeline__step' + cls + '">' +
                '<div class="timeline__rail"><div class="timeline__dot">' + mark + '</div><div class="timeline__line"></div></div>' +
                '<div class="timeline__body"><div class="timeline__title">' + s.label + '</div>' + subInfo + '</div>' +
              '</div>';
    });
    html += '</div>';
    return html;
  }

/* ล้างข้อมูลจำลองใน localStorage เพื่อกลับสู่ค่าเริ่มต้น */
  function resetDemoData() {
    if (confirm("ยืนยันการล้างข้อมูลทดสอบทั้งหมดเพื่อกลับสู่ค่าเริ่มต้นของระบบ?")) {
      localStorage.clear();
      location.reload();
    }
  }

  /* ตรวจสอบเกณฑ์เพดานงบประมาณย่อย 25% (FR-3) */
  function calculateBudgetRules(total, travel, equipment) {
    var t = Number(total) || 0;
    var tr = Number(travel) || 0;
    var eq = Number(equipment) || 0;

    var travelRatio = t > 0 ? (tr / t) * 100 : 0;
    var equipRatio = t > 0 ? (eq / t) * 100 : 0;

    return {
      travelRatio: travelRatio.toFixed(1),
      equipRatio: equipRatio.toFixed(1),
      isTravelValid: travelRatio <= 25.0,
      isEquipValid: equipRatio <= 25.0,
      isOverallValid: travelRatio <= 25.0 && equipRatio <= 25.0
    };
  }

/* ฟังก์ชันสลับบทบาทพร้อม Redirect ไปยังหน้าหลักของบทบาทนั้นทันที */
function switchRole(roleId) {
    if (!ROLES[roleId]) return;
    setRole(roleId); // บันทึกลง localStorage Key "rgms_role"
    
    var targetHome = ROLES[roleId].home;
    // ถ้าอยู่ที่หน้าปลายทางอยู่แล้ว ให้บังคับ Reload หน้าเพื่ออัปเดต Sidebar และข้อมูล
    if (window.location.pathname.indexOf(targetHome) !== -1) {
      window.location.reload();
    } else {
      window.location.href = targetHome;
    }
  }

  global.RGMS = {
    ROLES: ROLES, STAGES: STAGES, SCHOOLS: SCHOOLS, ROUND: ROUND, CRITERIA: CRITERIA,
    RESEARCH_TYPES: RESEARCH_TYPES, STRATEGY_GROUPS: STRATEGY_GROUPS, TRANSFER_LEVELS: TRANSFER_LEVELS, RESEARCH_STANDARDS: RESEARCH_STANDARDS,
    PROFILE_FIELDS: PROFILE_FIELDS, PROFILE_DEFAULT: PROFILE_DEFAULT, getProfile: getProfile, saveProfile: saveProfile, profileSaved: profileSaved,
    CURRENT_FY: CURRENT_FY, TIERS: TIERS, STAFF: STAFF, REVIEWERS: REVIEWERS, FINANCE_REVIEWERS: FINANCE_REVIEWERS, MEETINGS: MEETINGS, RESOLUTION: RESOLUTION,
    PROJECTS: PROJECTS, CHANGE_REQUESTS: CHANGE_REQUESTS, CALLS: CALLS, TIMELINE_ORDER: TIMELINE_ORDER,
    BUDGET_CATS: BUDGET_CATS, BUDGET_INSTALLMENTS: BUDGET_INSTALLMENTS, BUDGET_CAP_DEFAULT: BUDGET_CAP_DEFAULT, attachNeed: attachNeed,
    fmtMoney: fmtMoney, fmtBaht: fmtBaht, sumBudget: sumBudget, stageOf: stageOf, badgeHTML: badgeHTML, budgetTableHTML: budgetTableHTML,
    getProject: getProject, completeness: completeness, avgScore: avgScore, initials: initials,
    fyOf: fyOf, tierOf: tierOf, fiscalYears: fiscalYears, reviewerLoad: reviewerLoad, resolutionBadge: resolutionBadge, suggestReviewers: suggestReviewers,
    callStatus: callStatus, setCallStatus: setCallStatus, openCall: openCall,
    endorseStatus: endorseStatus, setEndorse: setEndorse,
    decisionOf: decisionOf, setDecision: setDecision, isAnnounced: isAnnounced, announce: announce, effectiveStatus: effectiveStatus,
    TRACK_STATUS: TRACK_STATUS, trackBadgeHTML: trackBadgeHTML, inReviewPhase: inReviewPhase,
    contentTrackStatus: contentTrackStatus, setContentTrackStatus: setContentTrackStatus,
    financeTrackStatus: financeTrackStatus, setFinanceTrackStatus: setFinanceTrackStatus,
    contentComment: contentComment, setContentComment: setContentComment,
    financeComment: financeComment, setFinanceComment: setFinanceComment,
    financeOwnerOf: financeOwnerOf, claimFinance: claimFinance, setFinanceOwner: setFinanceOwner, financeLoad: financeLoad,
    bothTracksCleared: bothTracksCleared, resubmitTracks: resubmitTracks,
   currentRole: currentRole, setRole: setRole, switchRole: switchRole, renderAppNav: renderAppNav,
    toast: toast, modal: modal, timelineHTML: timelineHTML,
    resetDemoData: resetDemoData, calculateBudgetRules: calculateBudgetRules
  };
})(window);
// ==========================================================================
// Global Command Palette Listener (Cmd + K / Ctrl + K) - Fixed & Enhanced
// ==========================================================================
document.addEventListener("keydown", function(e) {
  // ใช้ e.code === "KeyK" เพื่อรองรับแม้สลับเป็นแป้นพิมพ์ภาษาไทย
  if ((e.metaKey || e.ctrlKey) && (e.code === "KeyK" || (e.key && e.key.toLowerCase() === "k"))) {
    e.preventDefault();
    toggleCommandPalette();
  }
});

function toggleCommandPalette() {
  var existing = document.getElementById("cmd-palette-root");
  if (existing) {
    existing.remove();
    return;
  }

  var root = document.createElement("div");
  root.id = "cmd-palette-root";
  root.className = "cmd-palette-backdrop";
  root.innerHTML = 
    '<div class="cmd-palette">' +
      '<div class="cmd-palette__input-wrap">' +
        '<input type="text" id="cmd-input" class="cmd-palette__input" placeholder="พิมพ์คำสั่ง หรือค้นหา (เช่น ยื่นข้อเสนอ, กล่องงาน, มติ, โปรไฟล์)...">' +
        '<span class="cmd-key-badge">ESC เพื่อปิด</span>' +
      '</div>' +
      '<div class="cmd-palette__list" id="cmd-list">' +
        '<div class="cmd-palette__item" data-url="proposal-new.html"><span>ยื่นข้อเสนอโครงการใหม่ (RS-01)</span><span class="text-muted">Shortcut</span></div>' +
        '<div class="cmd-palette__item" data-url="staff-queue.html"><span>เปิดกล่องงานเจ้าหน้าที่ (Staff Queue)</span><span class="text-muted">Navigation</span></div>' +
        '<div class="cmd-palette__item" data-url="staff-agenda.html"><span>เข้าสู่วาระบันทึกมติ / ออกประกาศ</span><span class="text-muted">Executive</span></div>' +
        '<div class="cmd-palette__item" data-url="chair-review.html"><span>หน้าประธานวิจัยรับรอง (Chair Endorse)</span><span class="text-muted">School</span></div>' +
        '<div class="cmd-palette__item" data-url="secretary-home.html"><span>หน้าหลักเลขาสำนักวิชา</span><span class="text-muted">School</span></div>' +
        '<div class="cmd-palette__item" data-url="researcher-profile.html"><span>แก้ไขโปรไฟล์นักวิจัย</span><span class="text-muted">Profile</span></div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(root);

  // บังคับโฟกัสช่องพิมพ์ทันที
  var input = document.getElementById("cmd-input");
  if (input) {
    setTimeout(function() { input.focus(); }, 50);
    
    // ระบบกรองรายการเรียลไทม์ตามคำพิมพ์
    input.addEventListener("input", function() {
      var q = this.value.toLowerCase().trim();
      var items = document.querySelectorAll("#cmd-list .cmd-palette__item");
      items.forEach(function(item) {
        var text = item.textContent.toLowerCase();
        item.style.display = text.indexOf(q) >= 0 ? "flex" : "none";
      });
    });
  }

  // ระบบคลิกเลือกรายการเพื่อย้ายหน้า
  document.getElementById("cmd-list").addEventListener("click", function(e) {
    var item = e.target.closest(".cmd-palette__item");
    if (item && item.getAttribute("data-url")) {
      window.location.href = item.getAttribute("data-url");
    }
  });

  // จัดการการปิดหน้าต่างแบบ Event Cleanup
  function handleClose(e) {
    if ((e.type === "click" && e.target === root) || (e.type === "keydown" && e.key === "Escape")) {
      root.remove();
      document.removeEventListener("keydown", handleClose);
    }
  }

  root.addEventListener("click", handleClose);
  document.addEventListener("keydown", handleClose);
}

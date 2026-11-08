# Design — RGMS MVP Phase 1

ไดอะแกรมของ Must FR ทั้ง 6 ข้อ (FR-1 ถึง FR-6) ตาม SRS ไฟล์ `.mmd` คือต้นฉบับ Mermaid (แก้ได้ เปิดดูบน GitHub ได้เลย) ไฟล์ `.png` คือภาพที่เรนเดอร์แล้ว
เรนเดอร์ใหม่: `npx @mermaid-js/mermaid-cli -i 08-fr5-two-track-review.mmd -o 08-fr5-two-track-review.png -s 2 -b white`

## FR → ไดอะแกรม → หน้าจอ → เส้นทางคลิก (happy path)

เปิดต้นแบบที่ `index.html` เลือกบทบาทตามคอลัมน์ "บทบาท"

| FR | ไดอะแกรม | หน้าจอ | บทบาท | เส้นทางคลิก happy path | ตรวจแล้ว |
|---|---|---|---|---|---|
| FR-1 เปิดรอบทุน | [04](04-fr1-grant-call.png) | `staff-calls.html`, `proposal-new.html` | เจ้าหน้าที่ / นักวิจัย | สร้างรอบทุนใหม่ → เปิดรับ → นักวิจัยเปิดฟอร์มได้ · กดปิดรับ → ฟอร์มขึ้นว่าปิดรับ ยื่นไม่ได้ | คลิกจริงผ่าน |
| FR-2 โปรไฟล์ + นำเข้า RS-01 | [05](05-fr2-profile-import.png) | `researcher-profile.html`, `proposal-new.html` | นักวิจัย | บันทึกโปรไฟล์ → สร้างข้อเสนอ (ข้อมูลเติมอัตโนมัติ) → ลากไฟล์ .docx → ดูตัวอย่าง → ใช้ข้อมูล | มีตัวควบคุมครบ (ยังไม่ได้ทดสอบไฟล์ .docx จริงหลายไฟล์) |
| FR-3 งบประมาณ 17.2 | [06](06-fr3-budget-validation.png) | `proposal-new.html` | นักวิจัย | อัปโหลด Excel (หรือ "ใช้ไฟล์ตัวอย่าง" / "กรอกในระบบ") → ระบบแยก 6 หมวด → เตือนเกินเพดานและ 25% → เช็กลิสต์ผ่าน → ยื่นข้อเสนอ | มีตัวควบคุมครบ |
| FR-4 รับรองระดับสำนักวิชา | [07](07-fr4-endorsement.png) | `chair-review.html`, `secretary-home.html` | ประธาน/คณบดี, เลขา | ประธาน: ดูเอกสาร → "รับรอง → ส่งส่วนบริหาร" หรือ "ส่งกลับแก้ไข" · เลขา: ดูแดชบอร์ดสถานะ | คลิกรับรองจริงผ่าน |
| FR-5 ตรวจ 2 แทร็ก + ล็อกฟิลด์ | [08](08-fr5-two-track-review.png), [03](03-proposal-state-machine.png) | `staff-queue.html`, `reviewer-list/console`, `finance-review-queue/console`, `project-detail.html` | เจ้าหน้าที่, อนุกรรมการ, การเงิน | staff: รับเรื่อง → มอบคณะอนุกรรมการ · การเงิน: "รับตรวจ →" (Claim) / "เปลี่ยน ✎" (Admin Reassign) · อนุกรรมการ: ให้ความเห็น · ครบ 2 แทร็ก → พร้อมเข้า คกก. | คลิก Claim จริงผ่าน |
| FR-6 มติ + ประกาศผล | [09](09-fr6-resolution-announcement.png) | `staff-agenda.html`, `exec-overview.html` | ผู้บริหาร/เจ้าหน้าที่ | เลือกมติ + งบ → "บันทึกมติที่เลือก" → ติ๊กโครงการ → "ตรวจร่างและลงนามประกาศ" → ยืนยัน → แจ้งนักวิจัย | คลิกเลือกมติจริงผ่าน |

ไดอะแกรมภาพรวม: [01 Use case](01-use-case.png) · [02 สถาปัตยกรรม L1](02-architecture-L1.png) · [03 สถานะข้อเสนอ](03-proposal-state-machine.png) · [10 ER](10-er-diagram.png) (ตรงกับ `schema.sql`) · [11 แผนผังหน้าจอ](11-screen-map.png)

## หมายเหตุเรื่องความตรงกับ SRS
- SRS ตาราง 5.1 ระบุ UC-5 (ออกประกาศ) เป็น FR-5 แต่ในหัวข้อ 3 เป็น FR-6 ไดอะแกรมนี้ใช้ FR-6
- ตาราง Traceability ใน SRS (ข้อ 7) มีเฉพาะ FR-2 ถึง FR-5 ยังไม่มีแถวของ FR-1 และ FR-6 ควรเพิ่มให้ครบ
- ชื่อคลาสใน SRS (`ProfileManager`, `BudgetValidator`, `TrackRouter`, `FormLockEngine`) เป็นระดับออกแบบ ต้นแบบนี้ทำเป็นฟังก์ชันฝั่งเบราว์เซอร์ใน `shared.js`
- ยังไม่ได้ทำ: MFU SSO (NFR-2) ปัจจุบันใช้ตัวสลับบทบาทแบบสาธิต · Audit log (NFR-4) มีตาราง `audit_log` แต่ยังไม่มีกลไกบังคับห้ามแก้ไขย้อนหลัง

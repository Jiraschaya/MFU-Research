# Design Document: [MFU-Research]

## 1. System Architecture Overview
[อธิบายสถาปัตยกรรมของระบบเชิงแนวคิด เพื่อแสดงการไหลของข้อมูลระหว่างส่วนประกอบต่างๆ]
* **Frontend Component**: โครงสร้างส่วนต่อประสานผู้ใช้ที่ใช้ทำ Prototype และการจัดการ State ภายในหน้าจอ
* **Mock Data Layer**: โครงสร้างข้อมูลจำลอง (JSON/State Store) ที่ใช้แทนการต่อ Database จริงในการทำ Clickable Prototype
* **System Boundary**: ขอบเขตการทำงานของระบบที่ครอบคลุมเฉพาะ Must-Have FRs

## 2. UML Diagrams
### 2.1 Use Case Diagram
[แนบรูปภาพหรือโค้ด Mermaid Diagram]

* **Actors**: [ระบุผู้ใช้งาน เช่น General User, Admin]
* **Use Cases**:
  * `UC-01`: [ชื่อ Use Case] — รองรับ FR-01
  * `UC-02`: [ชื่อ Use Case] — รองรับ FR-02

### 2.2 Sequence Diagram
ไดอะแกรมแสดงลำดับขั้นตอนการทำงานทั้งแบบปกติและแบบเกิดข้อผิดพลาด[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span)

#### Sequence 01: Happy Path ([ชื่อ Flow หลัก])
[แนบ Sequence Diagram แสดงการส่งข้อมูลระหว่าง User -> UI -> Controller/State -> Mock Data]
* **Step-by-step Execution**:
  1. ผู้ใช้ส่งคำขอผ่านหน้าจอ [ชื่อ UI]
  2. ระบบประมวลผลและตรวจสอบความถูกต้องของข้อมูล
  3. ระบบส่งคืนสถานะสำเร็จและอัปเดตหน้าจอ

#### Sequence 02: Unhappy Path / Error Handling ([ชื่อ Flow ข้อผิดพลาด])
[แนบ Sequence Diagram แสดงการจัดการกรณีข้อมูลไม่ถูกต้อง หรือไม่พบข้อมูล]
* **Step-by-step Execution**:
  1. ผู้ใช้ส่งข้อมูลที่ไม่ถูกต้อง หรือค้นหารายการที่ไม่พบ
  2. ระบบตรวจพบข้อผิดพลาดและส่งคืน Error State
  3. หน้าจอแสดงผลข้อความแจ้งเตือน (Error Message / Empty State)

## 3. Data Model & Database Schema
โครงสร้างข้อมูลที่ใช้จัดเก็บเพื่อรองรับการทำงานของ Must-Have FRs[span_3](start_span)[span_3](end_span)

### Entity-Relationship Summary
* **Entity 1**: [ชื่อ Entity เช่น Users] — เก็บข้อมูลโปรไฟล์ผู้ใช้
* **Entity 2**: [ชื่อ Entity เช่น Transactions/Items] — เก็บข้อมูลกิจกรรมหลักของระบบ

### Table Specifications

#### Table: `users`
| Attribute | Data Type | Key | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | STRING / UUID | PK | NOT NULL, UNIQUE | รหัสประจำตัวผู้ใช้ |
| `name` | VARCHAR(100) | - | NOT NULL | ชื่อผู้ใช้งาน |
| `created_at` | TIMESTAMP | - | DEFAULT NOW() | เวลาที่สร้างรายการ |

#### Table: `[entity_name]`
| Attribute | Data Type | Key | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | STRING / UUID | PK | NOT NULL, UNIQUE | รหัสอ้างอิงรายการ |
| `user_id` | STRING / UUID | FK | REFERENCES users(id) | ไอดีผู้สร้างรายการ |
| `status` | VARCHAR(50) | - | NOT NULL | สถานะของรายการ |

## 4. UI Mapping & User Flow
ตารางเชื่อมโยงส่วนต่อประสานผู้ใช้เข้ากับเงื่อนไขทางเทคนิค[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)

| UI Screen ID | Screen Name | Mapped FR | Action / Trigger | State Handled |
| :--- | :--- | :--- | :--- | :--- |
| `UI-01` | หน้าป้อนข้อมูลหลัก | FR-01 | คลิกปุ่ม Submit | Valid -> เปลี่ยนหน้า `UI-02`<br>Invalid -> แสดง Inline Error |
| `UI-02` | หน้าแสดงผลลัพธ์ | FR-02 | โหลดข้อมูลรายการ | Found -> แสดง Data List<br>Not Found -> แสดง Empty State |


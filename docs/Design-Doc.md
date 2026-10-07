# Design Document: [MFU-Research]

## 1. System Architecture Overview
The MFU Research prototype use a layered archiecture to separate user interfaces, workflow processing, and data management. 
It consists of th Presentation layer, Business Logic layer, and Data Access layer, with the System Boundary defining the scope of the prototype.

* **Presentation Layer**: **Provides interfaces for Researchers, Reviewers, and Finance admins** to interact with the system and view workflow information.
* **Business Logic Layer**: Handles workflow rules and system behavior, including **Form-Level Locking and Admin Reassign**
* **Data Mocking Layer: Store simulated **Propoasls** and **Finance Claims** in memory instead of using a real database.
* **System Boundary**: Defines the functions included in the prototype, focusing on the **Must-have FUnctional Requirement** and excluding processes outside 
the system scope.

## 2. UML Diagrams

### 2.1 Use Case Diagram

* **Display the scope of the MFU Research system, focusing on the **Must-have Functional Requirements** (FR-01 to FR-06)
<img width="1160" height="1055" alt="Screenshot 2026-10-07 021056" src="https://github.com/user-attachments/assets/18663ebb-ecd0-4f6b-be55-9172ecc986d4" />  

* **Actors**: [Researchers, Research chair/Dean, School Secretary, Research Operation Staff, Research Finance Staff, 
Sub-Committee, Executive/Research Committee]

* **Use Cases**:
	* `UC-01`: [Open and Manage Call for Proposals] — รองรับ FR-01
	* `UC-02`: [Manage Researcher Profile & Import Proposal] — รองรับ FR-02
	* `UC-03`: [Manage Budget & Validate Rules] — รองรับ FR-03
	* `UC-04`: [School-Level Endorsement & Tracking] — รองรับ FR-04
	* `UC-05`: [Parallel 2 Track Review, Field Locking & Revise Loop] — รองรับ FR-05
	* `UC-06`: [Committee Resolution & Award Announcement] — รองรับ FR-06



### 2.2 Sequence Diagram
The diagram shows the workflow sequence for both the happy path and unhappy path.

#### Sequence 01: Happy Path ([Form Submission and Review-Time Form Locking])
<img width="2750" height="1704" alt="mermaid-diagram" src="https://github.com/user-attachments/assets/0e5f5c9d-ff6a-47ad-9a82-0664d356873a" />

* **Step-by-step Execution**:
  1. The Grant Applicant submits the proposal through the Proposal Submission UI.
  2. The system processes the request and validates the submitted data.
  3. The system returns a successful status and updates the UI to display the “Under Review” status.

#### Sequence 02: Unhappy Path / Error Handling ([ชื่อ Flow ข้อผิดพลาด])
<img width="2944" height="2626" alt="mermaid-diagram (1)" src="https://github.com/user-attachments/assets/6d054d5f-face-45ad-9474-9d4c67cee055" />

* **Step-by-step Execution**:
  1. The user attempts to modify a locked form or submits an incomplete disbursement request through the relevant UI.
  2. The system detects the error and returns an Error State.
  3. The UI displays an appropriate Error Message, such as “Form is locked during review” or a missing required field notification.

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


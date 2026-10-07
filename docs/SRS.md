## Software Requirements Specification
### 1. Introduction
1.1 Purpose and scope  

&emsp;Researchers, administrative staff, school leaders, and reviewers at Mae Fah Luang University (MFU) experienced significant delays and manual errors during research application and evaluation cycles. These issues are caused by paper-based submissions, repetitive biographical data entry, manual budget validation prone to calculation errors, zero tracking visibility at the school level and bottlenecks in central review processing. MFU Research is an assistant designed to streamline this process by reducing repetitive steps, replacing manual verification with an automated system, and providing end-to-end tracking across all approval and revision stages through a centralized platform.  

1.2 Users and stakeholders  

| Name / role | Kind | What they need | What they fear / forbid |
| :--- | :--- | :--- | :--- |
| Researchers / Applicants | Primary user | Submit proposals quickly, reuse their profile information, check budget details, and track proposal status in real time. | Spending excessive time on manual form entries or losing proposal drafts due to system failures. |
| Research chair / Dean | Secondary Stakeholders | Review and approve proposals submitted by researchers in their school before they are sent to the central administration. | Unverified or rule-violating proposals being sent to the central administration under their school's name. |
| School Secretary | Secondary Stakeholders | Track proposal status, documents, and reviewer comments within their school. | Not being able to track proposals and support researchers when needed. |
| Research Operations Staff | Internal admin | Check proposal completeness, create single-use reference numbers, and send announcements automatically. | Incomplete files, uneven workloads, or activities completed offline not being recorded. |
| Research Finance Staff | Internal admin / Reviewer | Verify budget line items against supporting documents and record audit notes. | Having to review budgets again when there are no financial changes. |
| Sub-committee | Reviewer | Evaluate proposal quality through comments without using a complex scoring system. | Proposal information being exposed or the reviewer's identity not being kept confidential. |
| Executive / Research Committee | Executive | View an overview of approved proposals and make decisions on funding allocation. | Approving proposals with incorrect budget structures or without all required approvals. |  

### 2. Overall description
2.1 Product context — what it does / does not  

RGMS is a centralized web platform for managing MFU research grants. In MVP Phase 1, the system focuses strictly on the pre-award phase up to award announcement.  

| IN SCOPE (MVP this term) | OUT OF SCOPE (explicit promise) |
| :--- | :--- |
| **FR-1** Manage grant call cycles, deadlines, and tier caps. | Contract signing and project bank account recording. |
| **FR-2** Single-source Researcher Profile & RS-01 .docx import. | Installment tracking and disbursement payouts (50/40/10). |
| **FR-3** Budget Form 17.2 (Excel/Web) with tier & 25% sub-cap validation. | Progress report submissions and final full report evaluation. |
| **FR-4** School-level Endorsement & Secretary tracking dashboard. | Financial voucher auditing (WJ.1–9) and asset return. |
| **FR-5** Parallel 2-Track Review (Content/Finance) & Auto-Route Revise Loop. | Post-award change requests (time extensions, budget transfers). |
| **FR-6** Executive Committee resolutions & Award Announcement generation. | 100-point rubric scoring (deprecated for Comment-based in Phase 1). |  

2.2 Assumptions and constraints

- **Assumption:** Users authenticate securely via MFU Single Sign-On (SSO).
- **Assumption:** Researcher profile data can be safely mapped and reused across multiple proposal submissions.
- **Assumption:** Uploaded Excel (Form 17.2) and .docx (RS-01) files adhere to standard university templates.
- **Constraint:** Scope in MVP Phase 1 terminates at the "Award Announcement" stage.
- **Constraint:** Budget rules and ceilings must strictly comply with the MFU Research Grant Regulation B.E. 2566.
- **Constraint:** Personal data and proposal storage must comply with Thailand PDPA laws.
  
### 3. Functional requirements

**FR-1: Open and Manage Call for Proposals.** 

**User story:** As a Research Staff, I want to create and manage calls for grant proposals with speciﬁc budget tiers and deadlines, so that researchers can submit proposals only within valid periods and rules.  
> Pain this traces to: Researchers submitting proposals out of period, or confusing budget caps between diﬀerent grant tiers.

1. Given a staff member is logged in, when they create a grant call specifying tier caps (100k/200k/300k) and deadline, then the system publishes the call as “Open”.  
2. Given a grant call has reached its closing deadline, when a researcher tries to submit, then the system blocks submission and displays a “Call Closed” notification.

**FR-2: Researcher Profile & RS-01 Proposal Import (.docx).**  

**User story:** As a Researcher, I want to maintain my profile once and import proposal content directly from a .docx file, so that I do not have to re-enter personal details and text manually for every submission.  
> Pain this traces to: Researchers spending hours copying and pasting biographical information (RS-01 Part B) and proposal text into web forms.

1. Given a researcher has completed their profile (RS-01 Part B), when creating a proposal, then the system auto-fills their profile and contact details into the form.  
2. Given a researcher uploads a valid RS-01 .docx file, when parsed client-side, then the system extracts text headings (Title, Abstract, Objectives, Methodology) into form fields with a verification preview panel.  
3. Given an uploaded .docx ﬁle has an invalid layout or corrupt structure, when parsing fails, then the system displays a graceful fallback warning allowing manual form entry without system failure.  

**FR-3: Budget Management & Rule Validation (Excel 17.2 & Web Form).**  

**User story:**  As a Researcher, I want to submit my budget via Excel (Form 17.2) or Web Form with live validation, so that I can ensure strict compliance with university budget rules before submission.  
> Pain this traces to: Manual calculation errors, exceeding overall tier caps, or violating the 25% ceiling for travel/equipment, causing immediate screening rejections.

1. Given a researcher uploads a Form 17.2 Excel ﬁle (.xlsx), when parsed, then the system maps budget items into 6 standard categories and calculates subtotals automatically.
2. Given a budget request exceeds the designated Tier Cap (e.g., >100,000 THB for New Researcher Tier), when validated, then the system blocks submission and highlights the excess amount.
3. Given travel or equipment categories exceed 25% of the total request, when validated, then the system displays a speciﬁc 25% sub-cap warning.

**FR-4: School-Level Endorsement & Tracking.**  

**User story:** As a School Research Chair or Dean, I want to review and endorse proposals submitted by my school’s faculty in-system, so that only veriﬁed proposals proceed to central research administration.  
> Pain this traces to: Central administration receiving unveriﬁed proposals, and school secretaries lacking visibility into approval statuses of faculty members.

1. Given a proposal is submitted, when it enters the school queue, then the School Research Chair/Dean can select “Endorse (Pass)” or “Return for Revision (Return to PI)”.
2. Given a proposal is returned by the School Chair, when the researcher resubmits the revised proposal, then it routes directly back to the School Chair queue.
3. Given proposals in their school, when a School Secretary views their dashboard, then the system displays real-time tracking of documents, statuses, and reviewer comments.

**FR-5: Parallel 2-Track Review, Field Locking & Auto-Route Revise Loop.**  

**User story:** As a Research Admin / Reviewer, I want content and finance reviews to run in parallel with field-level UI locking during revisions, so that the evaluation process is faster, eliminates duplicate work, and prevents unauthorized edits.
> Pain this traces to: Bottlenecks caused by sequential reviews, finance staﬀ losing track of assigned proposals when away, and researchers accidentally modifying approved sections during revisions.

1. Given a proposal passes screening, when review starts, then the system splits evaluation into two independent parallel tracks: Content Track (Sub-committee) and Finance Track (Claim-based Finance Staﬀ).
2. Given a finance staff clicks “Claim” on an unclaimed proposal, when conﬁrmed, then that staﬀ is bound as the permanent financial reviewer for that proposal across all revision cycles.
3. Given an assigned ﬁnance staﬀ is unavailable, when an Operations Admin executes an “Admin Reassign”, then the system unclaims the proposal and reassigns it to another ﬁnance staff member.
4. Given a researcher opens a proposal for revision, when a speciﬁc track (Content or Finance) is already “Approved”, then the system renders all form fields corresponding to that approved track as Read-Only (Field-Level Locking).
5. Given a researcher resubmits a revised proposal, when routed, then only non-approved tracks are automatically routed back to their original reviewers.
6. Given both Content and Finance tracks achieve “Approved” status, when veriﬁed, then the system updates proposal status to “Ready for Executive Committee”.

**FR-6: Committee Resolution & Award Announcement.**  

**User story:** As an Executive / Research Admin, I want to record committee resolutions and generate oﬃcial award announcements, so that approved projects can be formally published.  
> Pain this traces to: Delays in drafting award announcements and manually emailing decision results to researchers.

1. Given proposals marked “Ready for Executive Committee”, when the committee enters allocation resolutions, then the system updates proposal statuses to “Approved” or “Rejected”.
2. Given approved proposals, when staﬀ generates the award announcement, then the system compiles the official document, triggers e-Office signing ﬂow, and sends automated notifications via Email and System To-Do lists.

### 4. Non-functional requirements  

| ID | Kind | Statement (testable) | How we will check |
| :--- | :--- | :--- | :--- |
| NFR-1 | performance | The system shall parse Form 17.2 Excel files within 3 seconds and load proposal details within 2 seconds. | Stopwatch measurement across 5 sample Excel files and page reloads on standard network connection. |
| NFR-2 | security/privacy | The system shall authenticate users via MFU SSO and enforce Role-Based Access Control (RBAC) preventing unauthorized cross-school data access. | Execute access control tests attempting to access administrative/school endpoints with standard researcher credentials. |
| NFR-3 | reliability | The budget engine shall yield 100% identical calculation results between client-side Web Form inputs and server-side Excel parsing. | Run automated unit test suites comparing Web Form calculations against Excel parsed outputs across 20 test datasets. |
| NFR-4 | auditability | The system shall maintain an immutable audit log recording User ID, timestamp, and action for all status transitions.| Trigger status transitions and inspect database audit tables to confirm audit trail accuracy.|  

### 5. Use cases  
5.1 Use-case list  


| Use case | Actor | Related FR | Brief success story |
| :--- | :--- | :--- | :--- |
| UC-1 Manage Grant Call | Staff | FR-1 | Staff creates a grant call with a 200k tier cap; researchers view open call and submit within deadline |
| UC-2 Submit Proposal & Profile | Researcher | FR-2, FR-3 | Researcher imports RS-01 .docx and 17.2 Excel budget; system auto-fills profile and validates budget under 25% rules. |
| UC-3 Endorse Proposal | School Chair / Dean | FR-4 | Chair reviews proposal in school queue and approves it; proposal moves to central screening. |
| UC-4 Review Proposal (2-Track) | Sub-committee, Finance Staff | FR-5 | Sub-committee reviews content; Finance staff claims and approves budget; system locks approved fields during revision. |
| UC-5 Issue Award Announcement | Executive, Staff | FR-5 | Committee approves proposal; staff generates award announcement and notifies researcher via email/system. |  

5.2 Use-case diagram  

<img width="1160" height="1055" alt="Screenshot 2026-10-07 021056" src="https://github.com/user-attachments/assets/18663ebb-ecd0-4f6b-be55-9172ecc986d4" />  

### 6. Out of scope  

1. Contract signing and project bank account recording (Deferred to Phase 2).
2. Installment tracking and disbursement payouts (50/40/10).
3. Progress report submissions and ﬁnal full report evaluations.
4. Financial voucher auditing (WJ.1–9) and asset return management.
5. Post-award change requests (time extensions, budget transfers, PI changes).
6. 100-point rubric scoring (deprecated in favor of Comment-based review in Phase 1).

### 7. Traceability matrix (Golden Thread)  


| Problem / pain | Requirement (FR) | Solution / design | Feature built | Test |
| :--- | :--- | :--- | :--- | :--- |
| Researchers waste time reentering profile details for every grant submission | FR-2 Researcher Profile & Import | **L1 Architecture:** Layered Arch separating UI, Parsing Service, and Profile Data Layer.<br><br>**L2 Detailed Design:** Class: `ProfileManager.getProfile()`, `DocxParser.extractRS01()`, API: `POST /api/proposals/import-docx`.<br><br>**L3 UX/UI:** Profile persistence view & .docx dropzone with text preview panel. | Proposal Creation ( `proposalnew.html` ) & Profile Tab | Import 10 different .docx files; verify profile fields populate accurately without data loss |
| Manual budget calculation errors and 25% sub-cap violations causing screening rejections | FR-3 Budget Management & Validation | **L1 Architecture:** Layered Budget Engine (Single Source of Truth).<br><br>**L2 Detailed Design:** Class: `BudgetValidator.checkTierCap()`, `BudgetValidator.checkSubCap25()`, DB Composite Index on category prices.<br><br>**L3 UX/UI:** Live completeness checklist & budget warning chips. | Excel 17.2 Parser & Web Budget Form | Upload valid/invalid budget Excel files; verify >25% travel/equipment triggers immediate warnings |
| School administration has zero visibility over proposals submitted by their faculty. | FR-4 School-Level Endorsement | **L1 Architecture:** School RBAC Data Isolation Layer.<br><br>**L2 Detailed Design:** Class : `SchoolReviewService.endorse()`, API: `GET /api/school/proposals`.<br><br>**L3 UX/UI:** School Chair Approval Panel & Secretary Tracking Dashboard. | School Endorsement Interface ( `chair-review.html` ) | Log in as School Chair; verify access is restricted strictly to proposals from their own school |
| Review bottlenecks and accidental edits to approved sections during revisions | FR-5 Parallel 2-Track Review & Revise Loop | **L1 Architecture:** Event-driven State Machine with Field-Level Locking.<br><br>**L2 Detailed Design:** Class: `TrackRouter.routeRevision()`, `FormLockEngine.lockApprovedFields()`, DB Schema: `proposal_tracks` table.<br><br>**L3 UX/UI:** Dual-track review console with Read-Only UI badges on approved track fields. | Parallel Review Console & Claim Queue ( `staff-queue.html` ) | Submit revision for a proposal with 1 approved track; verify approved track UI fields are strictly read-only. |  

### 8. AI usage log  

If this table is empty but the prose looks generated, the milestone is capped at 50% — log every prompt that drafted a story or paragraph, honestly.  


| Date | Tool / model | What we asked | What AI produced | What we changed / verified | What we learned |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 24 Sep 2026 | Gemini 2.5 | Refine English SRS according to instructor feedback image, resolving flow contradictions and adding usable end-to-end details. | Updated 9-section English SRS draft resolving 2-track review field locking and school endorsement loops. | Added field-level form locking rules, admin reassign for finance claims, and verified all Given/When/Then acceptance criteria. | AI is highly effective at structuring robust acceptance criteria and traceability, but explicit form-level locking logic must be added to make review flows functional in real life. |






 













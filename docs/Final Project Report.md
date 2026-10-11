# Final Project Report

# Executive Summary
  MFU Research or RGMs (Research Grant Management System) is a proposed web platform that centralizes MFU's pre-award research grant process, addressing delays, manual errors, repetitive data entry, and limited status visibility. Using the Incremental SDLC, the MVP covers six key functions (Grant-call management, Researcher profiles and RS-01 import, Budget validation, Scool endorsement, Parallel content and finace review, and committee decision with award annoucements.) The requiements describe intended functioinality, not comfirmed implementation or tesing results.

# 1.Project Overview
Project title : MFU Research
Team name : I'm so hungry ahh
Course : Introduction to Software Engineering (15031001)
Source document : Team charter(M1) and SRS (M2)

**1.1 Team Members**

| student ID | Name|
| :---| :---|
| 6931503029 | จิรัชยา ยอนแมมะดัน |
| 6931503030 | ชยพล มูลกุล |
| 6931503036 | ทิพย์ไพลิน รุ่งทิพย์ธนกิจ |
| 6931503052 | ปัณณวิชญ์ เหล่าดี |
| 6931503054 | พลสพรรณ วันทนีย์พร |

# 2.Background and Problem Statement
 Research grant applications and ealutions and evaluations at MFU involve researchers, school leaders, school secretaries, research operations staff, finance staff, sub-committee reviewers, and the executive or research committee. The project documents identify delays and manual errors associated with paper-based submissions, repeated entry of researcher information, manual budget calculations, limited school-level tracking visibility, and bottlenecks in central review.

**2.1 Main Problems**
- Repeated data entry : Repeated entry of researcher information.
- Manual verification errors : Errors associated with paper-based submissions and manual verrification.
- Budget calculation errors : Errors associated with manual budget calculations and budget-limit checks.
- Limited tracking visibility : Limited visibility into proposals status t the school level.
- Review bottlenecks: Bottlenecks in central review.

**2.2 Why the problem Matters**
 These problems can increase administrative workload, delay funding decisions, create avoidable correction cycle, and harder for researchers and school staff to understand where a proposal stands. MFU research is intended to centralize the workflow and make important checks and status transiotions more visible.

 # 3.Project Objective
- Reduce repeated entry of researcher profile information by maintaining a reusable profile and supporting RS-01 .docx import.
- Reduce manual budget errors through automatic calculation and validation against grant-tier limits and applicable sub-cap rules.
- Provide school-level endorsement and a tracking dashboard for proposal status, documents, and comments.
MFU Research | Final Project Report Page 3
- Support parallel content and finance review, with clear reviewer assignment and revision routing.
- Protect already-approved sections using field-level read-only locking during revisions.
- Support recording committee resolutions and generating award announcements at the end of the Phase 1 workflow

# 4.Project Scope
**4.1 In scope**
- FR-1 Manage grant call cycles, deadlines, and tier caps.
- FR-2 Single-source Researcher Proﬁle & RS-01 .docx import.
- FR-3 Budget Form 17.2 (Excel/Web) with tier & 25% sub-cap validation.
- FR-4 School-level Endorsement & Secretary tracking dashboard.
- FR-5 Parallel 2-Track Review (Content/Finance) & Auto-Route Revise Loop.
- FR-6 Executive Committee resolutions & Award Announcement generation.

**4.2 Out of Scope**
- Contract signing and project bank account recording.
- Installment tracking and disbursement payouts (50/40/10).
- Progress report submissions and ﬁnal full report evaluation.
- Financial voucher auditing (WJ.1–9) and asset return.
- Post-award change requests (time extensions, budget transfers).
- 100-point rubric scoring (deprecated for Comment-based in Phase 1).

# 5.Stakeholders and Users

| Stakeholder | Main need/Responsibilities|
| :---| :---|
| Reserchers / applicants | Submit proposals, reuse profile data, check budget details, and track proposal status. |
| Research Chair / Dean  | Review and endorse proposals from their school before central administration. |
| School Secretary | Track school proposals, documents, statuses, and reviewer comments. |
| Research Operations Staff | Check completeness, create reference numbers, coordinate work, and send announcements. |
| Research Finance Staff | Review budgets and record financial comments. |
| Sub-committee | Evaluate proposal content and provide comments. |
| Executive / Research Committee  | Review approved proposals and make funding-allocation decisions. |

# 6. Development Methodology

The project selects the Incremental SDLC. The M1 charter explains that the team intends to establish a stable, functional MVP for the core pre-award process first and add post-award capabilities in later phases.

**6.1 Why Incremental***

- The system can be divided into related functional increments rather than built as one large release.
- The team can prioritize the core pre-award process and refine it before expanding the scope.
- Future releases can address deferred post-award work, such as contracts, installments, and project closeouts.

**6.2 Planned Phase 1 Workflow**
Grant call opens → researcher prepares a proposal and budget → school endorsement → central screening → parallel content and
finance review → revision loop where required → executive committee decision → award announcement.

This sequence summarizes the workflow described in the SRS. The two review tracks operate in parallel after screening, and only non-approved tracks should be routed back for revision.

# 7. Functional Requirements

**FR-1 : Open and Manage Call for Proposals**
Research staff create grant calls with deadlines and tier limits. The system publishes an open call and blocks submission after the closing deadline with a “Call Closed” notification.


**FR-2 : Researcher Profile and RS-01 Import**
Researchers maintain profile information for reuse. The system can populate profile and contact fields and extract key
headings—Title, Abstract, Objectives, and Methodology—from a valid RS-01 .docx file. If parsing fails, the system should warn the user and allow manual entry.


**FR-3 : Budget Management and Rule Validation**
Researchers submit budget information through Excel Form 17.2 or a web form. The system maps budget items into six standard
categories, calculates subtotals, checks the applicable tier cap (100,000 / 200,000 / 300,000 THB), and warns when travel or
equipment exceeds 25% of the total request. The M1 decision paths specify that exceeding the tier cap blocks submission, while exceeding the 25% sub-cap displays a warning.


**FR-4 : School-Level Endorsement and Tracking**
A School Research Chair or Dean can endorse a proposal or return it to the principal investigator for revision. After resubmission,the proposal returns to the School Chair queue. School Secretaries can view proposal documents, statuses, and reviewer comments in a tracking dashboard.


**FR-5 : Parallel 2-Track Review, Field Locking, and Revision Routing**
After screening, content review by the sub-committee and finance review run as independent tracks. Finance staff claim unclaimed proposals, and an Operations Admin can reassign a proposal if the assigned finance reviewer is unavailable. When a track is approved, its fields become read-only during revision. Resubmission routes only non-approved tracks to their original reviewers. When both tracks are approved, the proposal becomes “Ready for Executive Committee.”


**FR-6 : Committee Resolution and Award Announcement**
For proposals ready for the Executive Committee, the committee records allocation resolutions and the system updates each
proposal to “Approved” or “Rejected.” For approved proposals, staff can generate an award announcement and initiate the e-Office signing flow and notifications through email and system to-do lists.

# 8.Non-Functional Requirements

| NFR/kind | Requirement stated in SRS | Verification method stated in SRS |
| :---| :---| :---|
| NFR-1 Performance | Parse Form 17.2 Excel files within 3 seconds and load proposal details within 2 seconds.| Measure time across 5 sample Excel files and page reloads on a standard network.|
| NFR-2 Security / Privacy | Authenticate through MFU SSO and enforce RBAC to prevent unauthorized cross-school access.|Attempt to access administrative/school endpoints using researcher credentials.|
| NFR-3 Reliability | Budget calculations must be identical between web-form inputs and server-side Excel parsing |Run automated unit tests comparing results across 20 test datasets.|
| NFR-4 Auditability | Maintain an immutable audit log of user ID, timestamp, and action for status transitions. |Inspect audit records after triggering status transitions.|

# 9.System Workflow and Use Cases

**9.1 Main Workflow**
1. Research staff publish a grant call and specify the deadline and tier caps.
2. A researcher prepares a proposal, reuses profile data, imports RS-01 content if applicable, and submits a budget.
3. The school Chair/Dean endorses the proposal or returns it for revision.
4. Central screening takes place; then content and finance reviews proceed in parallel.
5. If revisions are needed, the system locks fields for approved tracks and routes the proposal to the reviewer(s) responsible for
non-approved tracks.
6. Once both tracks are approved, the proposal is sent to the Executive Committee.
7. The committee records its decision; staff generate the award announcement for approved proposals

**9.2 Use-case List**

|Use case|Primary actor(s) |Related FRs|Expected outcome|
|:--|:-- |:--|:-- |
|UC-1 Manage Grant Call|Research Staff |FR-1|A grant call is configured and available within its deadline|
|UC-2 Submit Proposal and Profile|Researcher|FR-2,FR-3|Profile/proposal data is prepared and the budget is validated.|
|UC-3 Endorse Proposal|School Chair / Dean  |FR-4|The proposal is endorsed or returned to the researcher.|
|UC-4 Review Proposal (2-Track) |Sub-committee, Finance Staff |FR-5|Content and finance reviews are completed with appropriate locking and revision routing.|
|UC-5 Issue Award Announcement|Executive Committee, Research Staff |FR-6|A decision is recorded and an award announcement is generated for approved proposals.|

# 10.Key Business Rules and Data Management

**10.1 Key Business Rules**

• A grant call that has passed its closing deadline cannot accept new submissions.
• Budget submission is blocked if the total exceeds the applicable grant-tier cap; the excess amount should be highlighted.
• Travel/equipment above 25% of the total request triggers a specific warning, as described in M1.
• Approved content or finance track fields are read-only during revisions.
• Only non-approved tracks are routed back to reviewers after resubmission.
• A proposal is ready for the Executive Committee only when both content and finance tracks are approved.

**10.2 Data That Must Persist**

The M1 charter identifies the following data as needing to persist between sessions: researcher profiles, grant-call configurations,
submitted proposal drafts and documents, budget breakdowns, review comments and statuses, and audit logs.
The SRS further identifies a need to reuse profile data, retain proposal and review information, restrict access by role/school, and
record audit details for status transitions. The exact production database schema and deployment configuration are not established
by these two source documents.


# 11.Requirement Traceability

|Problem/pain point|Requirement |Intended Solution |Verification|
|:--|:-- |:--|:-- |
|Repeated profile entry|FR-2|Reusable profiles and RS-01 .docx import|Test field extraction, preview, and invalid-file fallback.|
|Manual budget errors|FR-3|Automatic subtotals, tier-cap validation, and 25% warning|Test budget calculations, cap limits, and warning thresholds.|
|Low school-level visibility|FR-4|School endorsement and tracking dashboard|Verify school-specific proposal access and statuses.|
|Review bottlenecks and accidental edits|FR-5|Parallel review, finance claim/reassign, field locking, and revision routing|Test locking and routing after resubmission.|
|Slow decision announcements|FR-6|Committee resolution and award-announcement generation| Verify status changes and announcement workflow.|

# 12.Testinf and Evaluation Plan

**12.1 Minimum Test area**

- Grant call: Open/closed status and deadline enforcement.
- Document import: RS-01 extraction, preview accuracy, and invalid-file handling.
- Budget rules: Six categories, subtotals, grant-tier caps, and the 25% warning.
- School access: Endorsement workflow and school-level data restrictions.
- Two-track review: Parallel review, finance claim/reassign, field locking, and revision routing.
- Committee decision: Approved/Rejected status and award-announcement generation.
- Non-functional requirements: Response times, access control, budget consistency, and audit logs.

**12.2 Results Status**

M1 and M2 define requirements and proposed tests but do not provide complete test results. Actual test cases, inputs, expected and actual results, pass/fail status, screenshots, and resolved defects must be recorded before claiming successful verification.

# 13. Assumptions, Constraints, and Limitations

**13.1 Assumptions**
- Users authenticate through MFU SSO.
- Researcher profiles can be reused across proposals.
- Uploaded RS-01 .docx and Excel Form 17.2 files follow standard university templates.

**13.2 Constraints**
- Phase 1 ends at award announcement.
- Budget rules must comply with MFU Research Grant Regulation B.E. 2566.
- Personal data and proposal storage must comply with Thailand’s PDPA.

**13.3 Limitations of Available Evidence**

M1 and M2 do not confirm implementation completion, full deployment details, or actual test results. Post-award workflows are outside Phase 1. Claims about usability, stakeholder interviews, or measured performance require additional evidence.

# 14. Future Improvements

Future phases may extend the system to post-award workflows, including contracts, bank accounts, installment management, progress and final reports, voucher auditing, asset return, and post-award change requests. Usability reviews and stakeholder feedback should guide future incremental improvements. These features are not part of the Phase 1 deliverable.

# 15. AI Usage Disclosure

AI tools were used to support the drafting of the SRS and Final Project Report. The team used AI to refine English requirements based on instructor feedback, organize system requirements, clarify workflow logic, improve Given/When/Then acceptance criteria, and summarize project information for documentation.

The team reviewed and adjusted the generated content to ensure it aligned with the project requirements. AI was used as a drafting assistant, while the team remained responsible for checking the accuracy and suitability of the final documents.






















## Software Requirements Specification
### 1. Introduction
1.1 Purpose and scope


&emsp;Researchers, administrative staff, school leaders, and reviewers at Mae Fah Luang University (MFU) experienced significant delays and manual errors during research application and evaluation cycles. These issues are caused by paper-based submissions, repetitive biographical data entry, manual budget validation prone to calculation errors, zero tracking visibility at the school level and bottlenecks in central review processing. MFU Research is an assistant that simplify this process by reducing repetitive steps, replacing manual verification with an automated system and tracking system across all approval/revision stages through a centralized platform.  

1.2 Users and stakeholders  


| Name / role | Kind | What they need | What they fear / forbid |
| :--- | :--- | :--- | :--- |
| Researchers / Applicants | Primary user | Submit proposals quickly, reuse their profile information, check budget details, and track proposal status in real time. | Submit proposals quickly, reuse their profile information, check budget details, and track proposal status in real time. |
| Research chair / Dean | Secondat Stakeholders | Review and approve proposals submitted by researchers in their school before they are sent to the central administration. | Unverified or rule-violating proposals being sent to the central administration under their school's name. |
| School Secretary | Secondary Stakeholders | Track proposal status, documents, and reviewer comments within their school. | Not being able to track proposals and support researchers when needed. |
| Research Operations Staff | Internal admin | Check proposal completeness, create single-use reference numbers, and send announcements automatically. | Incomplete files, uneven workloads, or activities completed offline not being recorded. |
| Research Finance Staff | Internal admin / Reviewer | Review budgets based on supporting documents, and record financial comments. | Having to review budgets again when there are no financial changes. |
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







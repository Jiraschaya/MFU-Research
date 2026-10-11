# Final Project Report

# 1.Project Overview
  MFU Research is a proposed centralized web platform for managing research grant applications at Mae Fah Luang University (MFU). The project focuses on the pre-award process, from opening a grant call to announcing the funding decision.
 
  The system aims to reduce administrative delays and manual errors by centralizing proposal information, validating budgets, improving school-level tracking, and coordinating the review process.

# 2. Problem Statement and Objectives

The M1 Project Charter and M2 SRS identify several problems in the existing research grant application process:

- **Repeated data entry: Researchers spend time entering profile and proposal information for each submission.
- **Manual budget errors**: Incorrect calculations or violations of budget limits may cause proposals to fail screening.
- **Limited tracking visibility**: School staff have difficulty tracking proposal documents, statuses, and reviewer comments.
- **Review bottlenecks**: Sequential reviews and unclear task ownership may delay the process.
- **Revision control risks**: Researchers may accidentally modify information in a review track that has already been approved.

The project objectives are to reduce repeated data entry, validate budgets automatically, improve school-level endorsement and tracking, support parallel content and finance reviews, protect approved information during revisions, and support committee resolutions and award announcements.

# 3. Scope and Development Methodology

**3.1 In Scope: Phase 1 MVP**

The first phase covers the following functional requirements:

- **FR-1**: Open and manage calls for proposals, deadlines, and grant-tier limits.
- **FR-2**: Maintain researcher profiles and import RS-01 proposal content from .docx files.
- **FR-3**: Manage budgets through Excel Form 17.2 or a web form, with budget-limit validation.
- **FR-4**: Support school-level endorsement and proposal tracking.
- **FR-5**: Support parallel content and finance reviews, reviewer assignment, revision routing, and field-level locking.
- **FR-6**: Record committee resolutions and generate award announcements.

Phase 1 ends at the award announcement stage.

**3.2 Out of Scope**
The following activities are excluded from Phase 1: 
contract signing, bank-account recording, installment disbursements, progress and final reports, financial voucher auditing, asset-return management, post-award change requests, and 100-point rubric scoring.

**3.3 Development Methodology**
  The project uses the Incremental SDLC to establish a functional MVP for the core pre-award process first. Additional capabilities can be considered in later phases.

# 4.Stakeholders and Main Workflow
|Stakeholder|Main Responnsibility|
|:--|:--|
|Reserachers/Applicants|Prepare proposals, reuse profile data, submit budgets, and track status.|
|Research Chair / Dean|Endorse proposals or return them for revision.|
|School Secretary|Track school proposals, documents, statuses, and comments.|
|Research Operations Staff|Check completeness and coordinate the process.|
|Research Finance Staff|Review budgets and provide financial comments.|
|Sub-committee|Review proposal content and provide comments.|
|Executive / Research Committee|Make funding-allocation decisions.|

The planned workflow is:
  Grant Call Opens → Proposal and Budget Submission → School Endorsement → Central Screening → Parallel Content and Finance Review → Revision if Required → Executive Committee Decision → Award Announcement

During revision, only the non-approved review track is routed back to its original reviewer. Fields belonging to an approved track remain read-only.

# 5. Key Functional Rules and Non-Functional Requirements

**5.1 Key Functional Rules**

- Closed call: The system blocks submissions after the deadline and displays “Call Closed”.
- Budget tier cap: The applicable grant limits are 100,000, 200,000, or 300,000 THB. Submissions exceeding the applicable limit are blocked and the excess is highlighted.
- 25% sub-cap: Travel or equipment exceeding 25% of the total request triggers a warning.
- Field locking: Fields belonging to an approved review track become read-only during revision.
- Revision routing: Only non-approved tracks return to their original reviewers.
- Committee readiness: Both content and finance tracks must be approved before the proposal proceeds to the Executive Committee.

**5.2 Non-Functional Requirements**
|NFR|Requirement|
|:--|:--|
|NFR-1|Parse Excel files within 3 seconds and load proposal details within 2 seconds.|
|NFR-2|Use MFU Single Sign-On (SSO) and role-based access control.|
|NFR-3|Maintain consistent budget calculations between the web form and Excel parsing.|
|NFR-4|Maintain an immutable audit log containing user ID, timestamp, and action.|

# 6. Golden Thread: Requirement Traceability

The Golden Thread connects each requirement to its problem, design, feature, and planned test.

|Requirement|Problem|Design|Feature|
|:--|:--|:--|:--|
|FR-1: Grant Call Management|Researchers may submit proposals outside the open period or confuse budget caps between grant tiers.|Staff create a grant call with a budget cap and deadline. The system blocks submissions after the call closes.|Grant call management page.|
|FR-2: Researcher Profile and RS-01 Import|Researchers spend time re-entering profile and proposal information for each submission.|Save researcher profiles for reuse. Parse RS-01 .docx files and populate the proposal form through the import API.|Proposal creation page (proposalnew.html) and Profile tab.|
|FR-3: Budget Validation|Manual calculation errors and violations of the 25% sub-cap may cause proposals to fail screening.|Use a budget validation engine to check the grant-tier cap and 25% sub-cap.|Excel Form 17.2 parser and web budget form with warnings.|
|FR-4: School-Level Endorsement|Schools have limited visibility into their own proposals, and proposals may reach central administration without school-level verification.|Restrict each school’s access to its own proposals and provide an endorsement workflow.|School endorsement page (chairreview.html) and secretary dashboard.|
|FR-5: Parallel 2-Track Review|Sequential reviews can cause delays, and researchers may edit sections that have already been approved.|Run Content and Finance reviews in parallel. Lock approved track fields during revision.|Parallel review console and claim queue (staffqueue.html).|
|FR-6: Committee Resolution and Award Announcement|Preparing award announcements is time-consuming, and results are communicated manually.|The committee records its decision. For approved proposals, the system generates the award announcement and sends notifications.|Committee resolution page and announcement generator.|

# 7. Data and Testing

The system is expected to retain researcher profiles, grant-call settings, proposal drafts and documents, budget breakdowns, review comments and statuses, and audit logs.

Testing should cover grant deadlines, document import, budget limits, school-level access, review-track locking and routing, committee decisions, performance, access control, budget calculation consistency, and audit logs.

The tests listed in this report describe planned verification activities. They should only be marked as passed when the team has recorded actual results and supporting evidence. The source documents do not establish that every feature has been implemented or deployed.

# 8. Conclusion

  MFU Research aims to make the research grant application process more consistent and transparent by centralizing proposal information, validating budgets, improving status tracking, and coordinating parallel reviews. M1 defines the project’s purpose and scope, while M2 specifies the system requirements and expected behavior. The Golden Thread connects these requirements to their proposed designs, features, and tests.

# AI Usage log:
The M2 AI usage log records the use of Gemini 2.5 to refine the SRS and acceptance criteria. Any additional AI assistance used in preparing this report should be disclosed accurately according to the course requirements.

# Source Documents
M1 — Project Charter: MFU Research,M2 — Software Requirements Specification (SRS), Version 1.0, 24 September 2026.















# Golden Thread 

 shows how each problem we found leads to requirement, design, feature, and test.

# FR-1: Grant Call Management
- *Problem:* Researchers submit outside the open period or mix up the budget caps of different tiers.
- *Design:* Staff create a call with a tier cap and a deadline. After the deadline the system blocks submissions.
- *Feature:* Grant call management page.
- *Test:* Create a call with a 200k cap, wait until it closes, then try to submit. It should show "Call Closed".

# FR-2: Researcher Profile and RS-01 Import
- *Problem:* Researchers spend hours retyping their profile and proposal text for every submission.
- *Design:* Profile is saved once. A parser reads the RS-01 .docx (DocxParser.extractRS01()) and fills the form through POST /api/proposals/import-docx.
- *Feature:* Proposal creation page (proposalnew.html) and Profile tab.
- *Test:* Import 10 different .docx files and check that the fields are filled correctly with nothing lost.

# FR- 3: Budget Validation
- *Problem:* Manual calculation mistakes and 25% sub-cap violations get proposals rejected at screening.
- *Design:* One budget engine checks the tier cap and the 25% sub-cap (BudgetValidator.checkTierCap(), checkSubCap25()).
- *Feature:* Excel 17.2 parser and web budget form with warnings.
- *Test:* Upload valid and invalid Excel files. Travel or equipment over 25% should show a warning right away.

## FR-4: School-Level Endorsement
- *Problem:* Schools can't see their own faculty's proposals, and unverified proposals reach central administration.
- *Design:* Each school only sees its own proposals (SchoolReviewService.endorse(), GET /api/school/proposals).
- *Feature:* School endorsement page (chairreview.html) and secretary dashboard.
- *Test:* Log in as a School Chair and check that only proposals from that school appear.

# FR-5: Parallel 2-Track Review
- *Problem:* Sequential review is slow, and researchers sometimes edit sections that were already approved.
- *Design:* Content and Finance reviews run at the same time. Approved tracks are locked during revision (TrackRouter.routeRevision(), FormLockEngine.lockApprovedFields()).
- *Feature:* Parallel review console and claim queue (staffqueue.html).
- *Test:* Submit a revision where one track is approved and check that its fields are read-only.

# FR-6: Committee Resolution and Award Announcement
- *Problem:* Drafting announcements is slow and results are emailed by hand.
- *Design:* The committee records its decision, then the system generates the announcement and sends notifications automatically.
- *Feature:* Committee resolution page and announcement generator.
- *Test:* Mark a proposal as Approved, generate the announcement, and check that the email and To-Do notification are sent.

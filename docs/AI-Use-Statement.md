# AI Use Statement

We used AI tools to help draft and refine some of our documents.

## Entry 1 : Refining the SRS
- *Date:* 24 Sep 2026
- *Tool / model:* Gemini 2.5
- *What we asked:* Refine the English SRS according to the instructor's feedback image, fix contradictions in the flow, and add usable end-to-end details.
- *What AI produced:* An updated 9-section English SRS draft that fixed the 2-track review field locking and the school endorsement loop.
- *What we changed / verified:* Added field-level form locking rules and an admin reassign for finance claims. Checked all Given/When/Then acceptance criteria.
- *What we learned:* AI is good at structuring acceptance criteria and traceability, but we had to add the form-level locking logic ourselves so the review flow works in real life.

## Entry 2 : Drafting the Golden Thread
- *Date:* 7 Oct 2026
- *Tool / model:* Claude (Anthropic)
- *What we asked:* Help write Golden-Thread.md from our SRS, and translate the SRS into Thai so we could understand it.
- *What AI produced:* A Thai translation of the SRS, and a draft Golden Thread covering FR-1 to FR-6 in simple README style.
- *What we changed / verified:* FR-2 to FR-5 were based on our SRS section 7. FR-1 and FR-6 were written by AI without our design details. 
- *What we learned:* AI can quickly set up the structure, but it guesses names and details it does not know, so every row must be checked against our real design.

## Entry 3: Drafting the Design Document and Diagrams
* **Date:** 7 Oct 2026
* **Tool / model:** Gemini
* **What we asked:** Help draft the structure for Design-Doc.md, including system architecture overview, Mermaid.js sequence diagrams for Happy and Unhappy paths, data model schema, and UI screen mapping table based on our Must-Have FRs.
* **What AI produced:** A Markdown draft containing the design document template, Mermaid code for sequence diagrams, ERD/database table specifications, and a UI screen mapping matrix linked to requirements.
* **What we changed / verified:** Standardized attribute names (e.g., user_id and status) across the data model and diagrams, refined the Unhappy Path sequence flow to match actual validation errors, and verified that all components directly map back to SRS requirements.
* **What we learned:** AI accelerates writing Mermaid diagram syntax and table formatting, but manual alignment is necessary to ensure attribute names and state logic remain strictly coherent throughout the design specs.

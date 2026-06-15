AI Usage
This project used AI as a development assistant, not as a replacement for engineering decisions. I used it mainly to speed up requirement extraction, compare implementation options, review edge cases in the CSV, and get feedback on code/documentation structure. I remained responsible for the final policies, schema, importer behavior, balance calculation, and UI decisions submitted in the repository.

AI tools used
Arena.ai Agent Mode
Where AI helped
Summarizing the assignment requirements from the PDF.
Listing possible CSV anomaly categories to check manually.
Brainstorming data-cleaning policies for ambiguous rows.
Reviewing the database schema and suggesting table relationships.
Suggesting UI organization for dashboard, import report, expenses, members, and analytics pages.
Helping draft documentation outlines, which I then adjusted for the final project.
Key prompts / instructions
Examples of prompts I used:

"Read the assignment and identify the required deliverables."
"Inspect this expenses CSV and list possible data anomalies."
"Suggest a relational schema for expenses, expense shares, settlements, and import reports."
"Help review this balance calculation for edge cases."
"Suggest how to explain this code in a live interview."
Important decisions I made and verified
Use a relational schema with Expense, ExpenseShare, Settlement, ImportReport, and Anomaly tables.
Store money as integer paise instead of floating-point values.
Treat USD rows using a documented fixed FX rate instead of mixing currencies silently.
Treat repayment/deposit rows as settlements, not expenses.
Track membership dates so Sam is not charged before joining and Meera is not charged after leaving.
Surface every import anomaly instead of silently changing the data.
Cases where AI suggestions needed correction
Date ambiguity
AI initially suggested parsing dates directly. I changed the policy to explicitly parse the file as DD-MM-YYYY, flag 04-05-2026 as ambiguous, and document the decision.

Currency handling
A simple implementation could accidentally add USD values as if they were INR. I added an explicit USD-to-INR conversion policy and anomaly entries for foreign-currency rows.

Settlements vs expenses
Rows like Rohan paid Aisha back and Sam deposit share should not create expense shares. I imported them as Settlement records so they affect balances without inflating spending totals.

Membership changes
A naive split across all known members would incorrectly charge Sam for March and Meera for April. I added membership intervals and importer checks for inactive members.

Money precision
Some draft logic used normal decimal arithmetic. I changed the database model to store all final amounts as integer paise and handle rounding deterministically.

Final note
AI was used as a collaborator for speed and review. The final submitted behavior, anomaly policies, schema, and balance logic were reviewed and documented by me.

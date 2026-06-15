# AI Usage

## Tools used

Arena.ai Agent Mode was used to:

- Read the PDF assignment and extract requirements.
- Inspect the attached CSV and identify messy-data cases.
- Draft a simple Python/SQLite implementation.
- Generate documentation files and an import report.

## Key prompts / instructions

- "Read the assignment file and do the task provided using the data expenses export.csv."
- Internal follow-up: inspect CSV rows, infer anomaly policies, and implement an auditable importer.

## Cases where AI output needed correction

1. **Date ambiguity**: An initial approach could silently parse `04-05-2026` with the host locale. I corrected this by explicitly documenting DD-MM-YYYY and logging an `AMBIGUOUS_DATE` anomaly.
2. **USD handling**: A naive balance calculator might add USD amounts as if they were rupees. I added a fixed FX policy and anomaly entries for every foreign-currency row.
3. **Settlements**: A first pass could treat "Rohan paid Aisha back" and "Sam deposit share" as group expenses. I changed these rows to import into `settlements`, affecting balances without creating shares.
4. **Membership changes**: It is easy to split all expenses across all known people. I added membership intervals and a rule that removes Meera from stale April household splits while not charging Sam for March rows.
5. **Floating point money**: AI-generated examples often use floats. I used `Decimal` during import and integer paise in the database.

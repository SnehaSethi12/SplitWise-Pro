# Decision Log

## D1. Use SQLite as the relational database

Options considered: PostgreSQL, MySQL, SQLite. SQLite was chosen because the assignment data is small, the schema remains relational, setup is zero-friction, and reviewers can inspect one file locally. The schema can be moved to PostgreSQL without changing product behavior.

## D2. Imports must be auditable, not magical

Every non-obvious transformation creates an `anomalies` row with CSV row number, severity, code, message, and action. Rows are skipped only when they cannot safely affect balances, such as missing payer.

## D3. Currency policy

USD is converted to INR at a fixed documented rate of `1 USD = ₹83.00`. The app does not pretend USD equals INR. A real product would store an FX-rate table with source and effective date; here the fixed rate keeps the live review deterministic.

## D4. Date policy

The export is interpreted as DD-MM-YYYY because the users are in India and the file mostly uses that format. `Mar-14` is parsed as `2026-03-14`. Ambiguous dates such as `04-05-2026` are flagged, surfaced, and parsed as DD-MM-YYYY.

## D5. Duplicate policy

Obvious exact duplicates are skipped with the earlier row kept. Conflicting duplicates are flagged. If one conflicting row has a higher amount, this implementation keeps the higher amount and surfaces the replacement for approval; otherwise the later/lower-confidence row is skipped. A production app would put these into a human approval queue before final posting.

## D6. Membership-over-time policy

Balances are computed from explicit participants on each row, plus membership validation. If a person was included after leaving and this is clearly a stale household split (for example Meera after March), they are removed and the split is recalculated among active listed participants. Explicit guests on trip rows are honored.

## D7. Settlements versus expenses

Rows that say someone paid someone back or paid a deposit share are settlements, not shared expenses. They affect net balances but are not added to spending totals.

## D8. Percentage totals not equal to 100

If percentages sum to something other than 100, the importer normalizes them proportionally and flags the row. This preserves the user's intended relative weighting while keeping the expense fully allocated.

## D9. Rounding

Amounts are stored as integer paise. Inputs with more than two decimals are rounded half-up. If share allocation produces a paise remainder, the remainder is assigned deterministically to the alphabetically first participant and logged.

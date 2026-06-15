# Scope, Anomaly Log, and Database Schema

## Data problems detected and handled

The importer detects at least these problem classes in `expenses_export.csv`:

1. Duplicate exact dinner row: `Dinner at Marina Bites` / `dinner - marina bites`.
2. Conflicting duplicate dinner row: `Dinner at Thalassa` / `Thalassa dinner` with different payer/amount.
3. Amount with thousands separator: `"1,200"`.
4. Amount with more than two decimal places: `899.995`.
5. Lowercase / whitespace name variants: `priya`, `rohan `.
6. Alias name: `Priya S` -> `Priya`.
7. Missing payer on `House cleaning supplies`.
8. Settlement logged as expense: `Rohan paid Aisha back`.
9. Percent split sums to 110%, not 100%.
10. USD expenses requiring FX conversion.
11. Unknown/guest participant: `Dev's friend Kabir` normalized to `Kabir`.
12. Negative amount `Parasailing refund` treated as refund.
13. Non-standard date `Mar-14`.
14. Missing currency on `Groceries DMart`.
15. Zero-amount `Dinner order Swiggy` skipped.
16. Ambiguous date `04-05-2026` parsed as DD-MM-YYYY and flagged.
17. Meera listed after leaving on April groceries; removed from split.
18. Sam deposit share treated as settlement, not expense.
19. `split_type=equal` with share details on furniture row; details ignored because equal weights match equal split.
20. Share rounding remainders logged and assigned deterministically.

The generated app import report (`docs/IMPORT_REPORT.md`) lists the row-level instances.

## Database schema

- `users(id, email, password_hash)`
- `groups(id, name)`
- `people(id, name)`
- `group_memberships(id, group_id, person_id, joined_on, left_on)`
- `expenses(id, group_id, row_number, expense_date, description, paid_by_id, amount_inr_cents, original_amount, original_currency, split_type, raw_json)`
- `expense_shares(id, expense_id, person_id, share_inr_cents)`
- `settlements(id, group_id, row_number, settlement_date, payer_id, payee_id, amount_inr_cents, note)`
- `import_reports(id, filename, imported_at, rows_seen, expenses_imported, settlements_imported, rows_skipped)`
- `anomalies(id, report_id, row_number, severity, code, message, action, raw_json)`

All money is stored as integer paise to avoid floating-point drift.

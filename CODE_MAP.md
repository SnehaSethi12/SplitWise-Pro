# Code Map

## User action to code path

| User action | Code path |
|---|---|
| Login | `app/login/page.tsx` → `loginAction()` in `app/actions.ts` |
| Import bundled CSV | `app/import/page.tsx` → `importBundledAction()` → `importCsv()` |
| Upload CSV | `app/import/page.tsx` → `importUploadAction()` → `importCsv()` |
| View balances | `app/page.tsx` → `calculateBalances()` |
| Click Settle up | `app/page.tsx` form → `recordSettlementAction()` |
| Search expenses | `app/expenses/page.tsx` filters expenses server-side |
| Check membership | `app/members/page.tsx` uses `MEMBERSHIPS` dates |
| View person statement | `app/person/page.tsx` loads paid expenses and charged shares |

## Balance formula

For each person:

```text
+ expenses they paid
- their shares in all expenses
+ settlements they paid
- settlements they received
= net balance
```

Positive net = person should receive money.
Negative net = person owes money.

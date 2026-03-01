# Sample data for testing

## Transactions (CSV)

Use the CSV files to test **Dashboard → Upload CSV / JSON**. Each file has the expected columns: `date`, `amount`, `merchant`, `category`.

| File | Preset | Rows | Description |
|------|--------|------|-------------|
| `transactions-doctor.csv` | Doctor | ~130 | Higher income, healthcare, subscriptions |
| `transactions-lawyer.csv` | Lawyer | ~115 | Professional expenses, Westlaw, dining |
| `transactions-engineer.csv` | Engineer | ~140 | Tech, housing, subscriptions |
| `transactions-student.csv` | Student | ~110 | Lower income, student life |

## Contracts (text)

Use the files in `contracts/` to test **Contracts → Upload contract (PDF or text)**. Each `.txt` file is contract-style text; the app will extract provider, monthly cost, renewal date, notice period, and key clauses (via AI if needed).

| File | Description |
|------|--------------|
| `contracts/contract-AXA-Health-Insurance.txt` | Health insurance |
| `contracts/contract-Orange-Telecom.txt` | Mobile / telecom |
| `contracts/contract-EDF-Energy.txt` | Energy / utility |
| `contracts/contract-Malakoff-Médéric.txt` | Supplementary health |
| `contracts/contract-Canon-France-Pro.txt` | Printer lease |
| `contracts/contract-Westlaw-Legal-Research.txt` | Legal research subscription |
| `contracts/contract-Allianz-Professional-Indemnity.txt` | Professional indemnity |
| `contracts/contract-LexisNexis.txt` | Legal database |
| `contracts/contract-Free-Mobile.txt` | Mobile plan |
| `contracts/contract-Amazon-Prime.txt` | Amazon Prime |
| `contracts/contract-Hetzner-Cloud.txt` | Cloud hosting |
| `contracts/contract-Bouygues-Mobile-Student.txt` | Student mobile |
| `contracts/contract-Microsoft-365-Student.txt` | Microsoft 365 Student |
| `contracts/contract-Adobe-Creative-Cloud-Student.txt` | Adobe CC Student |

## Regenerate

```bash
# Transactions (CSV)
node scripts/generate-sample-csvs.mjs

# Contracts (text)
node scripts/generate-sample-contracts.mjs
```

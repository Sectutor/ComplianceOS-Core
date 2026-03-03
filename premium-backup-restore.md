# Premium Backup, Restore & Spreadsheet Import

## Goal
Help clients move from spreadsheets to the database and provide a Premium backup/restore by implementing JSON archiving for full backups, Merge/Upsert logic for restores, and a UI Column Mapping tool for spreadsheet ingestion.

## Tasks
- [x] Task 1: Create `exportOrgBackup` tRPC query to fetch all core org data (Frameworks, Controls, Risks, Assets) and return it as a structured JSON object.
  → Verify: Trigger from TRPC playground or simple button, check if JSON downloads correctly.
- [x] Task 2: Create `importOrgBackup` tRPC mutation that accepts the structured JSON and performs Prisma `upsert` operations to handle conflicts for existing records.
  → Verify: Upload a modified JSON backup, verify existing records are updated and new ones created without duplicating.
- [x] Task 3: Build frontend Backup/Restore Settings UI to allow downloading the JSON archive and uploading a JSON backup file.
  → Verify: End-to-end test of exporting, slightly modifying the JSON, and importing it back via the UI.
- [x] Task 4: Create a spreadsheet parser utility (e.g., using `papaparse` for CSV or `xlsx` for Excel) on the frontend to extract column headers and preview data.
  → Verify: Upload a sample CSV, verify the console logs the correct column headers.
- [x] Task 5: Build the "UI Column Mapping Tool" component that displays spreadsheet columns on one side and database fields (Title, Description, Status, etc.) on the other for user mapping.
  → Verify: UI renders correctly, user can select which spreadsheet column maps to which DB field.
- [x] Task 6: Create `importSpreadsheetData` tRPC mutation that takes the mapped data array and performs the same Merge/Upsert logic as the JSON restore.
  → Verify: End-to-end spreadsheet upload, mapping, and successful ingestion into the database.

## Done When
- [ ] Clients can download a full JSON backup of their org.
- [ ] Clients can upload a JSON backup and safely Merge/Upsert data.
- [ ] Clients can upload a spreadsheet, map columns via a UI, and merge the data into their org.

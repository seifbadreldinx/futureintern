# Production Migration Instructions

After deployment, run this ONE TIME on Railway:

```bash
python migrate_company_logos.py
```

This will:
1. Create the /uploads/logos/ directory
2. Fix logo paths from /logos/xxx.jpg to /uploads/logos/xxx.jpg  
3. Clean up references to non-existent logo files

After migration:
- All broken logo references will be removed
- Companies need to re-upload their logos via the dashboard
- Logos will display correctly on all pages

Note: The logo files themselves were lost during previous migrations.
Companies MUST re-upload their logos.

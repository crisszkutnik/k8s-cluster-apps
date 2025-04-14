## expenses-save-api

This app receives expenses via gRPC and saves them to Google Sheets.

Ideally, if this app grows it should be refactored into a different format:

1. Receive expense
2. Save it to DB
3. Trigger sync process to other destinations like Google Sheets or something else

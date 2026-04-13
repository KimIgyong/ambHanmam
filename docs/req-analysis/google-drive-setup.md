# Google Drive Integration Setup Guide

## Prerequisites

- Google Cloud Platform (GCP) account
- Admin access to the target Google Drive / Shared Drive

---

## Step 1: Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your **Project ID**

## Step 2: Enable Google Drive API

1. Go to **APIs & Services > Library**
2. Search for **Google Drive API**
3. Click **Enable**

## Step 3: Create a Service Account

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > Service Account**
3. Enter a name (e.g., `amb-drive-reader`)
4. Click **Create and Continue**
5. (Optional) Grant roles — not required for Drive access
6. Click **Done**

## Step 4: Generate a JSON Key

1. Click on the newly created service account
2. Go to the **Keys** tab
3. Click **Add Key > Create new key**
4. Select **JSON** format
5. Download the key file
6. Place it at: `secrets/google-service-account.json`

> **Important:** This file is excluded from git via `.gitignore`. Never commit it.

## Step 5: Share Drive Folders with the Service Account

The service account email looks like:
```
amb-drive-reader@your-project.iam.gserviceaccount.com
```

### For Shared Drives:
1. Open the Shared Drive in Google Drive
2. Click the Shared Drive name > **Manage members**
3. Add the service account email as a **Viewer**

### For Personal Folders:
1. Right-click the folder > **Share**
2. Add the service account email as a **Viewer**

## Step 6: Configure Environment Variable

The environment variable is already set in `env/backend/.env.development`:

```env
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./secrets/google-service-account.json
```

## Step 7: Register Folders in AMB Management

1. Log in as an **Admin** user
2. Go to **Documents** in the sidebar
3. Click **Register Folder**
4. Enter the folder ID (from the Google Drive URL)
   - URL format: `https://drive.google.com/drive/folders/{FOLDER_ID}`
5. Select drive type (Shared Drive or Personal Folder)
6. Save

---

## Troubleshooting

### "Google Drive is not configured"
- Ensure `secrets/google-service-account.json` exists
- Verify the `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` env var points to the correct path

### Files not showing up
- Verify the service account email has been granted access to the folder
- For Shared Drives, ensure the service account is a member
- Check that the folder ID is correct

### Permission denied errors
- The service account needs at least **Viewer** access
- Shared Drive members list must include the service account

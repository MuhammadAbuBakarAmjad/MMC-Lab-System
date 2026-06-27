# Mashallah Medical Complex — Lab Report System

A web-based system for creating, printing, and managing laboratory reports.
Runs on your local network (LAN) — no internet connection required.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Running the App](#3-running-the-app)
4. [Accessing from Other Computers on the Network](#4-accessing-from-other-computers)
5. [Setting Up Nightly Backup](#5-setting-up-nightly-backup-windows-task-scheduler)
6. [Restoring from a Backup](#6-restoring-from-a-backup)
7. [Adding New Test Templates](#7-adding-new-test-templates)
8. [Updating the System](#8-updating-the-system)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Before you begin, make sure the following software is installed on the server computer (the PC that will run the system):

**Node.js version 20 or higher**
- Download from: https://nodejs.org
- Choose the "LTS" version
- Run the installer and accept all defaults
- To check if it is installed, open Command Prompt and type: `node --version`
  You should see something like `v22.0.0`

**PostgreSQL version 18**
- Download from: https://www.postgresql.org/download/windows/
- Run the installer and accept all defaults
- **Write down the password you set** — you will need it later
- The default port is 5432 — do not change it unless you have a reason

---

## 2. Installation

Do these steps once, on the server computer.

### Step 1 — Download the project

If you received the project as a ZIP file:
- Extract the ZIP to a folder, for example: `C:\lab-system`

If you are using Git:
```
git clone <repository-url> C:\lab-system
```

### Step 2 — Install server dependencies

Open Command Prompt, then run:
```
cd C:\lab-system\server
npm install
```

### Step 3 — Install frontend dependencies

```
cd C:\lab-system\client
npm install
```

### Step 4 — Create the configuration file

Copy the example config file:
```
copy C:\lab-system\server\.env.example C:\lab-system\server\.env
```

Open the file at `C:\lab-system\server\.env` and fill in your PostgreSQL password:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=labsystem
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3000
BACKUP_PATH=./backups
GOOGLE_DRIVE_BACKUP_PATH=
```

Replace `your_password_here` with the PostgreSQL password you set during installation.

### Step 5 — Create the database

Open the PostgreSQL command line tool. Open Command Prompt and type:
```
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

It will ask for your PostgreSQL password. Type it and press Enter.
(You will not see the password as you type — that is normal.)

Once you see the `postgres=#` prompt, type:
```sql
CREATE DATABASE labsystem;
\q
```

### Step 6 — Set up the database tables and seed data

```
cd C:\lab-system\server
node db/init.js
```

You should see messages saying the tables were created and data was seeded.
This step also loads all the test templates (CBC, Urine R/E, etc.).

---

## 3. Running the App

### Development mode (for testing or making changes)

You need two Command Prompt windows open at the same time.

**Window 1 — Start the server:**
```
cd C:\lab-system\server
node index.js
```
You should see: `Lab system server running on http://localhost:3000`

**Window 2 — Start the frontend:**
```
cd C:\lab-system\client
npm run dev
```
You should see a URL like `http://localhost:5173`

Open that URL in a browser on the same computer to use the app.

---

### Production mode (for daily use)

In production mode, you only need one Command Prompt window.
The server handles both the API and the frontend.

**Step 1 — Build the frontend (do this once, or after any update):**
```
cd C:\lab-system\client
npm run build
```

**Step 2 — Start the server in production mode:**
```
cd C:\lab-system\server
set NODE_ENV=production
node index.js
```

The app will be available at `http://localhost:3000` on the server computer,
and at `http://<server-ip>:3000` from other computers on the network.

---

### Making the server start automatically when Windows boots

1. Press `Win + R`, type `shell:startup`, press Enter — this opens the Startup folder
2. Right-click inside the folder → New → Shortcut
3. In the "Type the location" box, paste:
   ```
   cmd /k "cd /d C:\lab-system\server && set NODE_ENV=production && node index.js"
   ```
4. Name the shortcut: `Lab System Server`
5. Click Finish

The server will now start automatically each time Windows starts.

---

## 4. Accessing from Other Computers

Any computer on the same Wi-Fi or LAN network can use the system in a web browser — no installation needed on those computers.

### Find the server computer's IP address

On the server computer, open Command Prompt and type:
```
ipconfig
```

Look for a line that says **IPv4 Address** — it will look something like `192.168.1.5`

### Open the app on another computer

On the other computer, open any web browser and go to:
```
http://192.168.1.5:3000
```
(Replace `192.168.1.5` with the actual IP address of your server computer.)

> **Note:** The IP address of your server may change if your router restarts.
> If the other computers can no longer connect, run `ipconfig` again to find the new IP.
> To avoid this, ask your IT person to give the server computer a fixed (static) IP address.

---

## 5. Setting Up Nightly Backup (Windows Task Scheduler)

This will automatically back up the database every night at 2:00 AM.

### Step 1 — Open Task Scheduler

Press `Win + S` and search for **Task Scheduler**. Open it.

### Step 2 — Create a new task

In the right panel, click **Create Basic Task...**

- **Name:** `Lab System Nightly Backup`
- **Description:** `Backs up the lab database every night`
- Click **Next**

### Step 3 — Set the schedule

- Select **Daily**
- Click **Next**
- Set Start time to **2:00:00 AM**
- Set **Recur every** to `1` days
- Click **Next**

### Step 4 — Set the action

- Select **Start a program**
- Click **Next**
- In the **Program/script** box, type:
  ```
  node
  ```
- In the **Add arguments** box, type:
  ```
  backup/backup.js
  ```
- In the **Start in** box, type the full path to your project folder:
  ```
  C:\lab-system
  ```
- Click **Next**

### Step 5 — Finish

- Review the summary and click **Finish**

### Step 6 — Test the backup task

Right-click the task you just created → **Run**

Then check that a `.sql` file was created in `C:\lab-system\backups\`.

---

### Optional: Also save backups to Google Drive

If Google Drive desktop app is installed on the server computer:

1. Open `C:\lab-system\server\.env` in Notepad
2. Find the line: `GOOGLE_DRIVE_BACKUP_PATH=`
3. Set it to your Google Drive backup folder path, for example:
   ```
   GOOGLE_DRIVE_BACKUP_PATH=C:\Users\YourName\Google Drive\Lab Backups
   ```
4. Create that folder in Google Drive if it does not already exist

The backup script will copy each backup file there automatically, and Google Drive will sync it to the cloud.

---

## 6. Restoring from a Backup

If something goes wrong with the database, you can restore it from a backup file.

### Step 1 — Find the backup file

Backup files are in `C:\lab-system\backups\`.
They are named like `backup_2026-06-09.sql`.
Use the most recent one, or the one from the date before the problem occurred.

### Step 2 — Open Command Prompt

### Step 3 — Drop and recreate the database (this erases all current data)

```
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS labsystem;"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE labsystem;"
```

Both commands will ask for your PostgreSQL password.

### Step 4 — Restore the backup

```
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d labsystem -f C:\lab-system\backups\backup_2026-06-09.sql
```

Replace `backup_2026-06-09.sql` with the actual file name you want to restore.

### Step 5 — Restart the server

```
cd C:\lab-system\server
set NODE_ENV=production
node index.js
```

---

## 7. Adding New Test Templates

You can add new test templates (like a new blood test) directly from the app — no coding required.

1. Open the app in a browser
2. Click **Settings** in the left sidebar
3. Scroll down to the **Test Templates** section
4. Click **Add New Template**
5. Fill in:
   - **Test Name** — e.g. `Vitamin D`
   - **Category** — e.g. `BIOCHEMISTRY` (or type a new category name)
   - **Report Type** — choose from the dropdown:
     - `standard` — tests with a numeric result and normal range (CBC, LFTs, etc.)
     - `qualitative` — tests with Reactive/Non-Reactive or Positive/Negative results
     - `descriptive` — tests with multiple sub-sections and dropdown fields (Urine R/E)
     - `hormones` — same as standard but the normal range is displayed as multi-line text
   - **Template Data** — this is a JSON structure that defines the fields of the test.
     Copy an existing template's JSON as a starting point and edit the field names, units, and normal ranges.
6. Click **Save**

The new template will appear immediately on the Create Report page.

> **Tip:** To temporarily hide a test without deleting it, use the Active toggle in the templates table.
> Inactive tests do not appear on the Create Report page but their data is not lost.

---

## 8. Updating the System

When you receive a new version of the system (via Git), run the update script instead of updating manually:

```
double-click update.bat
```

or from Command Prompt:
```
cd C:\lab-system
update.bat
```

This will:
1. Pull the latest code from Git
2. Install any new server packages
3. Rebuild the frontend

After it finishes, restart the server.

---

## 9. Troubleshooting

### The server won't start

**Error: `EADDRINUSE: address already in use :::3000`**
Another program is already using port 3000. Either:
- Close the other program, or
- Change the port by editing `C:\lab-system\server\.env` and changing `PORT=3000` to `PORT=3001`

**Error: `Cannot find module 'express'`**
Run `npm install` inside the `C:\lab-system\server` folder.

**Error: `ENOENT: no such file or directory ... .env`**
Create the `.env` file in `C:\lab-system\server\` — see Installation Step 4.

---

### Can't connect to the database

**Error: `password authentication failed for user "postgres"`**
The password in your `.env` file does not match the PostgreSQL password.
- Edit `C:\lab-system\server\.env`
- Update `DB_PASSWORD=` to the correct password

**Error: `database "labsystem" does not exist`**
Create the database — see Installation Step 5.

**Error: `connect ECONNREFUSED 127.0.0.1:5432`**
PostgreSQL is not running.
- Press `Win + S`, search for **Services**
- Find `postgresql-x64-18` in the list
- Right-click → **Start**

---

### Forgot PostgreSQL password

1. Open the file `C:\Program Files\PostgreSQL\18\data\pg_hba.conf` in Notepad (run Notepad as Administrator)
2. Find the lines that say `scram-sha-256` and change them to `trust`
3. Save the file
4. Restart the PostgreSQL service (see above)
5. Open Command Prompt and connect without a password:
   ```
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
   ```
6. Reset the password:
   ```sql
   ALTER USER postgres PASSWORD 'your_new_password';
   \q
   ```
7. Change `pg_hba.conf` back — replace `trust` with `scram-sha-256`
8. Restart the PostgreSQL service again
9. Update `DB_PASSWORD=` in `C:\lab-system\server\.env`

---

### Other computers can't access the app

1. Make sure the server is running in production mode (see Section 3)
2. Check the server's IP address with `ipconfig` — it may have changed
3. Make sure Windows Firewall is not blocking port 3000:
   - Press `Win + S`, search for **Windows Defender Firewall**
   - Click **Advanced settings**
   - Click **Inbound Rules** → **New Rule...**
   - Select **Port** → Next
   - Select **TCP**, enter `3000` → Next
   - Select **Allow the connection** → Next → Next
   - Name it `Lab System` → Finish

---

### Backup script fails

**Error: `'pg_dump' is not recognized as an internal or external command`**
The backup script uses the full path `C:\Program Files\PostgreSQL\18\bin\pg_dump`.
Make sure PostgreSQL 18 is installed at that path.
If you installed a different version, edit `C:\lab-system\backup\backup.js`
and update the `PG_DUMP_PATH` variable to the correct path.

**No file created in `./backups/`**
Check the output of the backup script for error messages.
Run it manually to see what happens:
```
cd C:\lab-system
node backup/backup.js
```

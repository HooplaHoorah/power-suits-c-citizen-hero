# DEVPOST PSC – Step 8: Deploy PSC Citizen Hero Backend on Vultr

_Last updated: 2025-12-05T04:36:02_

This doc tells **Antigravity** exactly what to do to spin up a small Vultr VM and run the `raindrop-backend` for **Power Suits C™: Citizen Hero™**.

The goal is to end up with a stable **HTTPS API URL** that the Netlify HUD can call and that we can list in the DevPost submission.

---

## 0. High‑level plan

1. **Create a tiny Ubuntu server on Vultr.**
2. **SSH into the VM** and install system dependencies.
3. **Clone the GitHub repo** and set up a Python virtual environment.
4. **Install backend Python packages** and run the Flask app with Gunicorn.
5. **Put Nginx in front** as a reverse proxy with HTTPS (Let’s Encrypt).
6. **Grab the final HTTPS URL** and send it back so we can:
   - update the frontend config to use it, and
   - mention it in the DevPost write‑up.

If anything looks different in the UI, make the closest reasonable choice and keep going.

---

## 1. Create the Vultr VM

1. In the Vultr dashboard, go to **Products → Compute**.
2. Click **Deploy Server**.
3. In **Location**, pick a US region that’s geographically reasonable (e.g., Atlanta, Dallas, Chicago).  
   _Consistency matters more than exact choice._
4. In **Server Type**, choose:
   - **Operating System → Ubuntu 22.04 x64 (LTS)**.
5. In **Server Size**, pick the **cheapest “Regular Performance” plan** that is available with the hackathon credit (1 vCPU, 1–2 GB RAM is plenty).
6. Leave extra options (Backups, IPv6, etc.) at defaults unless required.
7. Under **Server Hostname & Label**, set something clear like:
   - Hostname: `psc-citizen-hero-backend`
   - Label: `PSC Citizen Hero Backend`
8. Click **Deploy Now**.
9. Wait until the instance status shows **Running** and an **IPv4 address** appears.  
   - Note that public IPv4 address somewhere; we’ll call it `<VULTR_IP>` in the rest of this doc.

---

## 2. SSH into the VM

On **Windows**, use either Windows Terminal/PowerShell or PuTTY. The steps below assume the root login password is available in the Vultr UI.

1. From your local machine, open **PowerShell**.
2. Run:

   ```powershell
   ssh root@<VULTR_IP>
   ```

3. Accept the host key fingerprint if prompted.
4. Enter the root password from Vultr (you can view/reset it in the server details page).

Once logged in as root, proceed.

---

## 3. Basic server setup

Run these commands on the VM:

```bash
# Update package index
apt update

# Upgrade existing packages (optional but recommended)
apt -y upgrade

# Install basic tools
apt -y install git python3 python3-venv python3-pip nginx
```

Create a non‑root user (optional but preferable):

```bash
adduser citizenhero
usermod -aG sudo citizenhero
```

Then switch to that user:

```bash
su - citizenhero
```

All following commands assume we are the **citizenhero** user in its home directory.

---

## 4. Clone the repo and set up the backend

1. Clone the GitHub repo:

   ```bash
   git clone https://github.com/HooplaHoorah/power-suits-c-citizen-hero.git
   cd power-suits-c-citizen-hero/raindrop-backend
   ```

2. Create and activate a Python virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install backend dependencies.

   If a **requirements.txt** file exists in `raindrop-backend`, use:

   ```bash
   pip install -r requirements.txt
   ```

   If not, install the minimal known set:

   ```bash
   pip install flask flask-cors requests gunicorn python-dotenv
   ```

4. Do a quick sanity test:

   ```bash
   python app.py
   ```

   - You should see Flask start on `http://127.0.0.1:5000`.
   - Hit `Ctrl+C` to stop it once you see it running successfully.

---

## 5. Configure environment variables (RAINDROP + app env)

Still inside `power-suits-c-citizen-hero/raindrop-backend` with the virtualenv active:

1. Create a simple `backend.env` file for our service (even if `python-dotenv` isn’t used directly, we’ll mirror the values in systemd):

   ```bash
   cat > backend.env << 'EOF'
   APP_ENV=production
   # Optional: point to a PostgreSQL/SQLite URL if used later
   # DATABASE_URL=sqlite:///citizenhero.db

   # Raindrop SmartInference – fill these using the user’s secure values
   RAINDROP_API_URL=<RAINDROP_SMARTINFERENCE_ENDPOINT>
   RAINDROP_API_KEY=<RAINDROP_API_KEY>
   EOF
   ```

2. Replace `<RAINDROP_SMARTINFERENCE_ENDPOINT>` with the actual SmartInference URL from the LiquidMetal/Raindrop console when available.
3. Replace `<RAINDROP_API_KEY>` with the **actual key** supplied by the user (do **not** commit this to GitHub).

We’ll wire these into systemd in the next step.

---

## 6. Run the backend with Gunicorn (app server)

We’ll run the Flask app via Gunicorn on an internal port (e.g., 5000) and proxy it with Nginx.

1. Create a Gunicorn start command to test:

   ```bash
   cd ~/power-suits-c-citizen-hero/raindrop-backend
   source .venv/bin/activate
   export $(grep -v '^#' backend.env | xargs -d '\n')   # load env vars
   gunicorn -w 2 -b 127.0.0.1:5000 app:app
   ```

2. In another SSH session or using `curl` on the server, verify it responds:

   ```bash
   curl http://127.0.0.1:5000/health
   ```

   You should get a simple JSON health message or a 200 OK.

3. Once verified, stop Gunicorn with `Ctrl+C` so we can create a proper **systemd service**.

---

## 7. Create a systemd service for the backend

1. As **root** (or via `sudo`), create a service file:

   ```bash
   sudo tee /etc/systemd/system/citizenhero-backend.service > /dev/null << 'EOF'
   [Unit]
   Description=Power Suits C Citizen Hero Flask backend
   After=network.target

   [Service]
   User=citizenhero
   Group=citizenhero
   WorkingDirectory=/home/citizenhero/power-suits-c-citizen-hero/raindrop-backend
   EnvironmentFile=/home/citizenhero/power-suits-c-citizen-hero/raindrop-backend/backend.env
   Environment=PATH=/home/citizenhero/power-suits-c-citizen-hero/raindrop-backend/.venv/bin
   ExecStart=/home/citizenhero/power-suits-c-citizen-hero/raindrop-backend/.venv/bin/gunicorn -w 2 -b 127.0.0.1:5000 app:app
   Restart=always
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   EOF
   ```

2. Reload systemd and start the service:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable citizenhero-backend
   sudo systemctl start citizenhero-backend
   ```

3. Check its status:

   ```bash
   sudo systemctl status citizenhero-backend
   ```

   Make sure it’s **active (running)** with no obvious errors.

---

## 8. Configure Nginx as reverse proxy

We will expose the backend on **port 80** behind Nginx. HTTPS will be added in the next step.

1. Create a new Nginx server block:

   ```bash
   sudo tee /etc/nginx/sites-available/citizenhero-backend > /dev/null << 'EOF'
   server {
       listen 80;
       server_name _;

       location / {
           proxy_pass         http://127.0.0.1:5000;
           proxy_set_header   Host $host;
           proxy_set_header   X-Real-IP $remote_addr;
           proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header   X-Forwarded-Proto $scheme;
       }
   }
   EOF
   ```

2. Enable the site and test Nginx:

   ```bash
   sudo ln -s /etc/nginx/sites-available/citizenhero-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   ```

3. Reload Nginx:

   ```bash
   sudo systemctl reload nginx
   ```

4. From your local machine, hit:

   ```text
   http://<VULTR_IP>/health
   ```

   You should see the backend health check JSON. (This will still be **HTTP**, not HTTPS.)

---

## 9. Add HTTPS with Let’s Encrypt (requires a domain)

> If there’s no time to wire a domain, you can **skip to Step 10** and use this as an internal API from another backend service.  
> For the hackathon and Netlify frontend, we strongly prefer HTTPS, so do this if at all possible.

1. Point a DNS record (e.g., `citizenhero-api.hooplahoorah.com`) at `<VULTR_IP>` via your DNS provider.
2. On the VM, install Certbot:

   ```bash
   sudo apt -y install certbot python3-certbot-nginx
   ```

3. Run Certbot:

   ```bash
   sudo certbot --nginx -d citizenhero-api.hooplahoorah.com
   ```

   - Provide an email (for renewal notices).
   - Agree to the terms.
   - Choose the option to **redirect HTTP to HTTPS**.

4. After success, test:

   ```text
   https://citizenhero-api.hooplahoorah.com/health
   ```

   You should see the same health JSON, now over HTTPS with a valid certificate.

---

## 10. Hand back the backend URL & update the frontend

Once HTTPS is working, post the final API base URL in your notes:

- **Backend base URL:**  
  `https://citizenhero-api.hooplahoorah.com`

Antigravity should then:

1. Open the **GitHub repo** for `power-suits-c-citizen-hero`.
2. Locate the frontend config file that defines the API base (either `frontend/config.js` or the file with `API_BASE_URL` / `getApiBaseUrl()`).
3. Replace any placeholder like:

   ```js
   return 'https://citizen-hero-backend.raindrop.app';
   ```

   with:

   ```js
   return 'https://citizenhero-api.hooplahoorah.com';
   ```

4. Commit and push to **main**:

   ```bash
   git add frontend/*.js
   git commit -m "Point frontend to Vultr-hosted backend"
   git push origin main
   ```

5. Wait for Netlify to automatically redeploy `https://psc-citizen-hero.netlify.app/` and then test the full flow:
   - Forge a mission.
   - Answer clarifying questions (if RAINDROP API is configured).
   - Confirm mission → see quest with steps and SGXP tally.
   - View suit log → ensure quests are persisted.

---

## 11. Final DevPost notes for Vultr usage

When everything is running:

- Note in the DevPost submission that:
  - The **Flask backend + quest DB** are running on a **Vultr Cloud Compute VM (Ubuntu 22.04)**.
  - Netlify hosts the static HUD at `https://psc-citizen-hero.netlify.app/`.
  - Optional: Raindrop SmartInference is invoked from the Vultr backend, using `RAINDROP_API_URL` + `RAINDROP_API_KEY`.

If something fails, capture the error message (`systemctl status`, `journalctl -u citizenhero-backend`, or `nginx -t`) and we’ll iterate.

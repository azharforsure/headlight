# 🚀 Hosting Guide: Headlight Crawler Engine

This guide walks you through hosting your **Crawler Engine** for free using **Oracle Cloud** or **Hugging Face Spaces**.

---

## 🏗 Option 1: Oracle Cloud (Always Free)
*Best for: 24/7 high-speed crawling, millions of pages, and complete control.*

### Step 1: Sign Up
1. Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Sign up for an account. **Note:** You will need a credit card for identity verification, but you won't be charged.
3. Select a "Home Region" (Try to pick one close to you).

### Step 2: Create your Instance
1. In the Oracle Console, go to **Compute** -> **Instances** -> **Create Instance**.
2. **Image and Shape:**
    - Click **Edit**.
    - Click **Change Shape**.
    - Select **Ampere (ARM)**.
    - Check the box for **VM.Standard.A1.Flex**.
    - Set OCPUs to **4** and Memory to **24 GB**. (This is the maximum "Always Free" allowance).
3. **Networking:**
    - Ensure "Assign a public IPv4 address" is set to **Yes**.
4. **SSH Keys:**
    - Click **Save Private Key**. You will need this to log in!
5. Click **Create**.

### Step 3: Open the Firewall (VCN)
1. On the Instance Details page, click on the **Subnet** link.
2. Click on the **Default Security List**.
3. Click **Add Ingress Rules**.
4. Add the following rule:
    - **Source CIDR:** `0.0.0.0/0`
    - **IP Protocol:** `TCP`
    - **Destination Port Range:** `3001`
    - **Description:** Headlight WebSocket Port
5. Click **Add Ingress Rules**.

### Step 4: Install Docker and Run
Connect to your server via SSH:
```bash
ssh -i your-key.key ubuntu@YOUR_INSTANCE_IP
```

Run these commands to install Docker and start the crawler:
```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io

# Clone your repo (or just the server folder)
git clone https://github.com/your-username/headlight.git
cd headlight/server

# Build and Run
sudo docker build -t headlight-engine .
sudo docker run -d -p 3001:3001 --name crawler headlight-engine
```

---

## 🤗 Option 2: Hugging Face Spaces (The Easy Way)
*Best for: Quick setup, sharing with your audience, and 16GB of RAM.*

### Step 1: Create a Space
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces).
2. Click **Create new Space**.
3. Name your space (e.g., `headlight-engine`).
4. **SDK:** Select **Docker**.
5. **Template:** Select **Blank**.
6. **Space Hardware:** Select the **Free 16GB RAM** tier.
7. Click **Create Space**.

### Step 2: Upload Files
1. In your new Space, go to the **Files** tab.
2. Upload all the files from your `server/` directory (including the `Dockerfile` we just created).

### Step 3: Use the URL
1. Once it builds (it takes ~2 mins), your space will be "Running."
2. Your WebSocket URL will look like this:
   `wss://your-username-headlight-engine.hf.space`

---

## 🔗 Connecting to your Frontend
Once your engine is live, you need to tell your Cloudflare Pages site to use it.

1. Go to your **Cloudflare Pages Dashboard**.
2. Go to **Settings** -> **Environment Variables**.
3. Add a new variable:
   - **Key:** `VITE_CRAWLER_WS_URL`
   - **Value:** `wss://your-public-ip-or-hf-url:3001`
4. Re-deploy your site.

---

## 💡 Pro Tip for your Audience
You can make a "One-Click Deploy" button for Hugging Face so your users can host their own engine easily. Add this to your `README.md`:

```markdown
[![Deploy to Hugging Face](https://huggingface.co/datasets/huggingface/badges/resolve/main/deploy-to-spaces-lg.svg)](https://huggingface.co/new-space?template=your-username/headlight-engine)
```

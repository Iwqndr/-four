# Discord custom name connection setup

Follow these exact steps to get **"@fourhrt"** on your Discord profile instead of a `pages.dev` URL.

---

### Step 1: Create the Bot Identity
Discord uses the "Bot" as the profile identity.
1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications/1487396450634567762).
2.  On the left, click the **"Bot"** tab.
3.  Click **"Add Bot"** (if you haven't yet).
4.  Set the **Username** to `@fourhrt` (or whatever you want your profile name to be).
5.  Upload an icon—this will be the icon on your profile!
6.  Scroll down to the bottom and click **"Save Changes"**.

---

### Step 2: Set the Authorization Settings
Tell Discord where your website is located.
1.  On the left, click the **"OAuth2"** tab.
2.  In the **Redirects** section, click **"Add Redirect"**.
3.  Paste: `https://fourhrts.pages.dev/api/callback`
4.  Click **"Save Changes"**.

---

### Step 3: Define the "Linked Roles" (Metadata)
This is what makes it show up under your "Connections."
1.  On the left, click **"General Information"** (or look for a **"Linked Roles"** tab if it appeared).
2.  Scroll to the very bottom and look for **"Role Connection Metadata"**.
3.  Click **"Add Metadata"** or the **"+"** button.
4.  Set these values:
    -   **Name**: `Verified`
    -   **Key**: `verified`
    -   **Type**: `Integer (Greater Than)`
    -   **Description**: `Owner of fourhrt`
5.  Click **"Save Changes"** at the bottom.

---

### Step 4: Refresh and Link
Now that Discord knows who you are, link it to your account.
1.  Make sure you have already run **`push.bat`** on your computer if you haven't lately.
2.  Visit this link in your browser: `https://fourhrts.pages.dev/api/authorize`
3.  Wait for Discord to ask you to authorize. Click **"Authorize"**.
4.  You should see a "Successfully linked!" message.

---

### Step 5: Activate on Profile
1.  Open your **Discord Settings** (the gear icon next to your name).
2.  Go to **"Connections"**.
3.  Click **"Add"**.
4.  You should now see **"@fourhrt"** in the list!
5.  Select it and make sure your **"Display on Profile"** switch is turned **ON**.

**That's it! Your profile now has its own custom name and iron icon.**

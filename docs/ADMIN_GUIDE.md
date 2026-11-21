# FitMe admin dashboard: how to use each control

Open **https://fit-me1.web.app/admin** and sign in with your Google account (you are the super admin). Every change is
saved on the server, reaches the app within about a minute without a new release, and is written to the
**Activity log** with who, when and the before and after values. Payment and subscription records are never edited.

| Section | What you can do | How |
|---|---|---|
| **Overview** | Live counts (users, active, stages, subscriptions, revenue, testimonials), charts of sign-ups and food scans, activity totals, revenue by country; CSV export. | Pick a range (7/30/90/365 days) and optionally a country code; **Export CSV**. Your own session controls are at the bottom. |
| **User management** | Search users, see profile, plan, free stage, country, devices, diagnostics. Deactivate / reactivate, **Give free access** (Pro or Premium for N days, or end it), **Change trial** (extend, restart from today, end now), **Send a message**. | Search by email, phone, name or ID, open a user. Each change asks for a reason (kept in the log). |
| **Finance** | **Countries and prices**: per country or currency group, prices for each plan, tax name, tax % and whether prices include tax, payment methods (Google Play, App Store, Cashfree web), on/off, add a country. **Payments** with filters and printable receipts (GST details for India). **Webhook logs**. | Edit, **Save** (every save is a new price version; old versions are kept). Store prices must also be set in the store consoles: see `docs/store/pricing.md`. |
| **Plans and features** | **Free Launch Mode** on/off, for everyone or chosen countries. **Features per plan**: move any feature to Free, Premium or Pro, everywhere or per country (for example photo scan free in India). Plan names, descriptions, benefits and whether a plan is offered. | Free Launch Mode is **on** at launch. Turn it off here: members go back to the Welcome Unlock, trial or paid plan at once. |
| **Trials** | Welcome Unlock days (default 7) and trial days (default 30), the plan each stage unlocks, and different days per country. | For one person, use User management → Change trial. |
| **Coupons and offers** | Discount codes: percent or fixed amount, per country/market, plan and period, total uses, start and end dates. Switch off instead of deleting. | Members enter codes on the Plans screen. For app store payments create matching offer codes in the store consoles. |
| **Content** | **Home and banners**: tagline, banners with image, link, dates and countries, the promotional ribbon, order and visibility of Home sections, stories title. **App texts**: change any text of the app in any language. **Pages**: FAQ, help articles, terms, privacy and tips with search title and description (shown at /p/<address> and in Help). **Media**: image library. | Pick the language at the top. In App texts search for the words you want to change; keep `{{…}}` placeholders. |
| **Food database** | Search, add, edit, hide foods; approve or reject AI-estimated foods from users; bulk import (CSV, up to 500 rows per upload); merge duplicates (the duplicates are hidden and their names become search aliases). | |
| **Testimonials** | Approve, reject, request changes, feature on Home, unpublish. | |
| **Notifications** | Send to everyone, a country, a plan or one user, now or at a set time (scheduled ones go out within the hour); save templates; **Announcements** on Home for chosen countries and plans between two dates. | Push reaches the phone apps; everyone also gets it in the bell inbox. |
| **Features** | Switch any part of the app on or off (photo scan, AI estimate, coach, planner, store, testimonials, device sync, reminders, upgrade prompts, route tracking, contact form, diagnostics, **cloud watches — keep off** until the Open Wearables backend exists). | |
| **Application settings** | Store links, support email and phone, privacy and terms links, social links, **maintenance mode** (with a message), **minimum app version** (older phone apps must update). | |
| **API keys** (super admin only) | Enter or replace keys for the AI provider, Cashfree, RevenueCat and Open Wearables. Keys go to Google Secret Manager, are never shown again, and each has **Test connection**. | |
| **Support** | Inbox of messages from Help and contact (reply, close, reopen; replies reach the member's inbox). **Diagnostics** reports sent from the app. | |
| **Admin management** (super admin only) | Add staff by email and choose a role: Super admin, Admin, Finance, Content editor, Support. | Roles see only their sections; this is checked on the server and in the database rules. |
| **Activity log** | Every admin action with before and after values; filter by type, search, **Export CSV**. | |

Role summary: **Admin** = everything except API keys and staff; **Finance** = overview, finance, plans, trials,
coupons, log; **Content editor** = overview, content, foods, testimonials, notifications; **Support** = overview,
users (view, message), testimonials, support inbox, foods.

# FIT ME AI: Next steps in Claude Code

Claude Code has finished Step 0 (stack confirmed, CLAUDE.md updated) and is waiting for two files.

## 1. Add the two documents to the repo

Upload both files to Claude Code with message A below. Claude Code will save them as:

- `docs/PRD.md` (Master PRD v2.0)
- `docs/ORIGINAL_SPEC.md` (original specification, in English)

## 2. Send these messages in order

Send one message at a time. Wait for Claude Code to finish and report before sending the next one.

---

### Message A: answer Step 0 and start the audit

```
ok. I've attached the two documents. Save them as docs/PRD.md and docs/ORIGINAL_SPEC.md
and commit them before anything else.

Answers to your four points:
1. Native sign-in: agreed. Use @capacitor-firebase/authentication in the mobile apps and the
   Firebase JS SDK on the web.
2. Ads on the web: not decided yet. Build AdMob for the mobile apps only and show no ads on the
   web for now. Keep it listed in PRD section 15.
3. Fonts: agreed. Add Noto Sans Tamil and Noto Sans Arabic as well.
4. Navigation: follow PRD section 12. A white floating bottom bar with five tabs: Home, Planner,
   Health, Workouts and Store. Profile and Settings open from the avatar in the header.
   Update the matching line in CLAUDE.md.

Also update CLAUDE.md so that its "Design system" section points to PRD section 12 as the
final design system, and its "Key product decisions" match PRD sections 2 to 4.

Then start STEP 1, the audit. It is report-only: do not change any app code.
Write docs/AUDIT.md exactly as described in STEP 1, then stop and show me the summary.
```

---

### Message B: after you have read the audit

Read `docs/AUDIT.md` first. If something is wrong or missing, tell Claude Code before you send this.

```
ok, the audit is approved. Start STEP 2, the redesign.

Follow PRD section 12 exactly: light mode (cream and white with green) as the default,
dark mode as an option, Inter plus the Noto fallbacks, the type scale, and the card,
button, input and navigation rules. No emojis and no jargon.

This step is visual only. Do not change features, data or logic.
When you finish, save screenshots of every screen at 390 px in light and dark mode to
docs/screenshots/, check each one yourself, then stop and show them to me.
```

---

### Message C: after you have approved the screenshots

If a screen looks wrong, describe it first, for example: "On the Planner screen the cards are too
close together and the title is too small. Fix this before moving on."

```
ok, the redesign is approved. Start Phase 0 (Foundation) from STEP 3.

First show me the plan: the packages you will add, the Firebase setup steps I must do myself,
and the order of work. Wait for my "ok" before writing code.
```

---

### Message D onwards: one phase at a time

After each phase report, check what was built. Then send:

```
ok, Phase <N> is approved. Update docs/AUDIT.md, then start Phase <N+1>.
Show me the plan first and wait for my "ok".
```

## 3. Useful messages while building

| Situation | Message |
| --- | --- |
| Something is broken | `This is broken: <what you saw, on which screen>. Find the root cause, explain it, then fix it and add a test. Do not change unrelated code.` |
| Check a module | `Check <module name> against PRD section <N> and the Definition of Done in CLAUDE.md. List the gaps. Do not fix anything yet.` |
| Continue after a break | `Continue Phase <N> from where you stopped. First tell me what is done and what is left.` |
| Something looks off-brand | `This screen does not follow PRD section 12: <what is wrong>. Fix it and show me a new screenshot.` |
| Before you approve a phase | `Before I approve: list anything in this phase that still uses mock or demo data, anything you could not test, and anything I must set up myself.` |

## 4. Things only you can do

Claude Code will ask for these when it reaches them:

- Create the three Firebase projects (`fitmeai-dev`, `fitmeai-staging`, `fitmeai-prod`) and follow the setup steps Claude Code gives you (Firebase CLI login, registering the iOS, Android and web apps).
- Set up Google and Apple sign-in in the Firebase console (bundle IDs, SHA keys).
- Build and run the iOS app on a Mac with Xcode.
- Create the Apple Developer ($99/year) and Google Play Console ($25 one-time) accounts.
- Create products and prices in App Store Connect and Play Console, and set up RevenueCat and Cashfree accounts (Phase 2).
- Fill in the values in PRD section 15 when Claude Code needs them.

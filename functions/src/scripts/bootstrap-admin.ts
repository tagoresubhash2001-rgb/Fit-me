/**
 * One-time: makes the Google account that owns the Firebase project the first super admin.
 *   GOOGLE_APPLICATION_CREDENTIALS=<key> node lib/scripts/bootstrap-admin.js --project fit-me1 [--owner someone@gmail.com]
 * The owner is read from the project's IAM policy (roles/owner). It refuses to run once any super admin
 * exists (appConfig/adminBootstrap records the run), so it cannot be used to grant more access later; further
 * admins are added from the admin dashboard by a super admin.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function projectOwners(project: string): Promise<string[]> {
  const token = await applicationDefault().getAccessToken();
  const res = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:getIamPolicy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw new Error(`getIamPolicy failed: HTTP ${res.status}`);
  const policy = (await res.json()) as { bindings?: Array<{ role: string; members: string[] }> };
  return (policy.bindings ?? []).filter((b) => b.role === 'roles/owner').flatMap((b) => b.members.filter((m) => m.startsWith('user:')).map((m) => m.slice(5).toLowerCase()));
}

async function main() {
  const project = arg('project');
  if (!project) throw new Error('--project is required');
  if (/prod/i.test(project)) throw new Error('run this against production only with the owner present');
  initializeApp({ projectId: project });
  const db = getFirestore();
  const marker = db.doc('appConfig/adminBootstrap');
  if ((await marker.get()).exists || !(await db.collection('staff').where('role', '==', 'superAdmin').limit(1).get()).empty) {
    console.log('A super admin already exists: bootstrap is disabled. Add admins from the admin dashboard.');
    return;
  }
  const owners = await projectOwners(project);
  const email = (arg('owner') ?? owners[0] ?? '').toLowerCase();
  if (!email || !owners.includes(email)) throw new Error(`owner not found in the project IAM policy (owners: ${owners.length})`);
  const auth = getAuth();
  let user = await auth.getUserByEmail(email).catch(() => null);
  let created = false;
  if (!user) {
    // No FitMe account yet: create one for the owner's Google address; signing in with Google uses it.
    user = await auth.createUser({ email, emailVerified: false });
    created = true;
  }
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: 'superAdmin' });
  await auth.revokeRefreshTokens(user.uid);
  await db.doc(`staff/${user.uid}`).set({ uid: user.uid, email, role: 'superAdmin', grantedBy: 'bootstrap', at: FieldValue.serverTimestamp() });
  await marker.set({ uid: user.uid, at: FieldValue.serverTimestamp(), createdAccount: created });
  await db.collection('adminLogs').add({ actorUid: 'bootstrap', actorRole: 'superAdmin', actorEmail: null, action: 'staff.bootstrapSuperAdmin', targetType: 'user', targetId: user.uid, before: null, after: { role: 'superAdmin' }, note: created ? 'account created for the project owner' : null, at: FieldValue.serverTimestamp() });
  console.log(`super admin set for the project owner (uid ${user.uid}${created ? ', new account' : ''})`);
}

main().catch((e) => {
  console.error(String((e as Error).message ?? e));
  process.exit(1);
});

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminCredentialsError } from '@/lib/firebase-admin';

// ── Helper: verify the caller is an org_admin or superadmin ──────────────────
// Falls back to a lightweight Firestore read using the Admin SDK (requires creds).
// If credentials aren't configured we return a 503 with a clear setup message.
async function verifyOrgAdmin(
  req: NextRequest,
): Promise<{ uid: string; orgId: string; role: string } | null> {
  const uid = req.headers.get('x-uid');
  if (!uid) return null;
  try {
    const snap = await adminDb.doc(`users/${uid}`).get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    if (!['org_admin', 'superadmin'].includes(data.role)) return null;
    return { uid, orgId: data.orgId ?? uid, role: data.role };
  } catch (err) {
    if (isFirebaseAdminCredentialsError(err)) {
      throw new Error('FIREBASE_ADMIN_CREDENTIALS_MISSING');
    }
    throw err;
  }
}

function credentialsError() {
  return NextResponse.json(
    {
      error:
        'Firebase Admin SDK is not configured. Add FIREBASE_SERVICE_ACCOUNT_KEY to .env.local.\n\n' +
        'Steps:\n' +
        '1. Firebase Console → Project Settings → Service Accounts → Generate new private key\n' +
        '2. node -e "console.log(Buffer.from(require(\'fs\').readFileSync(\'./key.json\')).toString(\'base64\'))"\n' +
        '3. Paste the output as FIREBASE_SERVICE_ACCOUNT_KEY in .env.local\n' +
        '4. Restart the dev server.',
    },
    { status: 503 },
  );
}

// ── POST – create a member with email + password ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const caller = await verifyOrgAdmin(req);
    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { email, password, role, displayName } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'email, password and role are required' }, { status: 400 });
    }
    if (!['agent', 'org_admin'].includes(role)) {
      return NextResponse.json({ error: 'role must be agent or org_admin' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const orgId = caller.orgId;

    // Check if email already exists in this org
    const existingQuery = await adminDb
      .collection('users')
      .where('email', '==', email.trim().toLowerCase())
      .where('orgId', '==', orgId)
      .get();
    if (!existingQuery.empty) {
      return NextResponse.json(
        { error: 'A member with this email already exists in your organization.' },
        { status: 409 },
      );
    }

    // Create Firebase Auth user
    let authUser;
    try {
      authUser = await adminAuth.createUser({
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName?.trim() || email.split('@')[0],
      });
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        // Reuse existing Auth user (they just aren't in this org yet)
        authUser = await adminAuth.getUserByEmail(email.trim().toLowerCase());
        // Update their password to the one the admin set
        await adminAuth.updateUser(authUser.uid, { password });
      } else {
        throw authErr;
      }
    }

    // Write / merge Firestore user doc
    await adminDb.doc(`users/${authUser.uid}`).set(
      {
        uid: authUser.uid,
        email: authUser.email,
        displayName: displayName?.trim() || email.split('@')[0],
        photoURL: authUser.photoURL || null,
        role,
        orgId,
        status: 'active',
        createdAt: new Date(),
        // Plaintext password stored for admin viewing / resetting
        passwordPlain: password,
        authMethod: 'email_password',
      },
      { merge: true },
    );

    return NextResponse.json({ success: true, uid: authUser.uid });
  } catch (err: any) {
    if (err.message === 'FIREBASE_ADMIN_CREDENTIALS_MISSING' || isFirebaseAdminCredentialsError(err)) {
      return credentialsError();
    }
    console.error('[org-members POST]', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

// ── PATCH – change a member's password ────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const caller = await verifyOrgAdmin(req);
    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { targetUid, newPassword } = await req.json();
    if (!targetUid || !newPassword) {
      return NextResponse.json({ error: 'targetUid and newPassword are required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Ensure the target belongs to the same org
    const targetSnap = await adminDb.doc(`users/${targetUid}`).get();
    if (!targetSnap.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const targetData = targetSnap.data()!;
    if (caller.role !== 'superadmin' && targetData.orgId !== caller.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await adminAuth.updateUser(targetUid, { password: newPassword });
    await adminDb.doc(`users/${targetUid}`).update({
      passwordPlain: newPassword,
      passwordChangedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === 'FIREBASE_ADMIN_CREDENTIALS_MISSING' || isFirebaseAdminCredentialsError(err)) {
      return credentialsError();
    }
    console.error('[org-members PATCH]', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

// ── GET – list members with passwords ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const caller = await verifyOrgAdmin(req);
    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const snap = await adminDb
      .collection('users')
      .where('orgId', '==', caller.orgId)
      .get();

    const members = snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        status: data.status,
        authMethod: data.authMethod || 'google',
        passwordPlain: data.passwordPlain || null,
      };
    });

    return NextResponse.json({ members });
  } catch (err: any) {
    if (err.message === 'FIREBASE_ADMIN_CREDENTIALS_MISSING' || isFirebaseAdminCredentialsError(err)) {
      return credentialsError();
    }
    console.error('[org-members GET]', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

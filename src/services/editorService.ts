import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface InviteToken {
  token: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  createdBy: string;
  used: boolean;
  usedBy?: string;
  usedAt?: Timestamp;
}

export interface EditorUser {
  uid: string;
  name: string;
  email: string;
  role: 'pending' | 'editor';
  createdAt: Timestamp;
  approvedAt?: Timestamp;
}

// ── Tokens de invitación ──────────────────────────────────────────────────────

/**
 * Genera un token UUID v4 como string sin guiones
 */
const generateTokenId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Crea un token de invitación en Firestore con expiración de 72 horas.
 * Solo debe llamarse cuando el usuario es admin.
 */
export const generateInviteToken = async (adminUid: string): Promise<string> => {
  const token = generateTokenId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // +72h

  await setDoc(doc(db, 'inviteTokens', token), {
    token,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    createdBy: adminUid,
    used: false,
  });

  return token;
};

/**
 * Valida un token de invitación.
 * Retorna el documento si es válido, null si no existe, expiró o ya fue usado.
 */
export const validateInviteToken = async (
  token: string
): Promise<{ valid: boolean; reason?: string; data?: InviteToken }> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'inviteTokens', token));

    if (!tokenDoc.exists()) {
      return { valid: false, reason: 'Token de invitación inválido.' };
    }

    const data = tokenDoc.data() as InviteToken;

    if (data.used) {
      return { valid: false, reason: 'Este enlace de invitación ya fue utilizado.' };
    }

    const now = new Date();
    const expiresAt = data.expiresAt.toDate();
    if (now > expiresAt) {
      return { valid: false, reason: 'Este enlace de invitación ha expirado.' };
    }

    return { valid: true, data };
  } catch (error) {
    console.error('Error validating invite token:', error);
    return { valid: false, reason: 'Error al verificar el enlace de invitación.' };
  }
};

/**
 * Marca un token como usado tras el registro exitoso.
 */
export const markTokenAsUsed = async (token: string, uid: string): Promise<void> => {
  await updateDoc(doc(db, 'inviteTokens', token), {
    used: true,
    usedBy: uid,
    usedAt: serverTimestamp(),
  });
};

// ── Usuarios pendientes y editores ────────────────────────────────────────────

/**
 * Obtiene la lista de usuarios con role == 'pending'.
 */
export const getPendingUsers = async (): Promise<EditorUser[]> => {
  const q = query(collection(db, 'users'), where('role', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as EditorUser));
};

/**
 * Obtiene la lista de usuarios con role == 'editor'.
 */
export const getEditors = async (): Promise<EditorUser[]> => {
  const q = query(collection(db, 'users'), where('role', '==', 'editor'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as EditorUser));
};

// ── Cloud Function callables ──────────────────────────────────────────────────

const functions = getFunctions(undefined, 'us-central1');

/**
 * Aprueba o rechaza un usuario pendiente.
 */
export const approveOrRejectEditor = async (
  uid: string,
  action: 'approve' | 'reject'
): Promise<{ success: boolean; message: string }> => {
  const approveEditorFn = httpsCallable<
    { uid: string; action: string },
    { success: boolean; message: string }
  >(functions, 'approveEditor');

  const result = await approveEditorFn({ uid, action });
  return result.data;
};

/**
 * Revoca o elimina un editor activo.
 */
export const revokeOrDeleteEditor = async (
  uid: string,
  action: 'revoke' | 'delete'
): Promise<{ success: boolean; message: string }> => {
  const revokeEditorFn = httpsCallable<
    { uid: string; action: string },
    { success: boolean; message: string }
  >(functions, 'revokeEditor');

  const result = await revokeEditorFn({ uid, action });
  return result.data;
};

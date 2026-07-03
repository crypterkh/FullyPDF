import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import localforage from 'localforage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

localforage.config({
  name: 'pdf-toolkit',
  storeName: 'processed_files'
});

export async function saveWorkHistory(userId: string | undefined, filename: string, operation: string, fileBlob?: Blob | null) {
  if (!userId) return;
  try {
    let localId: string | null = null;
    if (fileBlob) {
      localId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await localforage.setItem(localId, fileBlob);
    }
    
    const data: any = {
      filename,
      operation,
      timestamp: Date.now()
    };
    
    if (localId) {
      data.localId = localId;
    }

    try {
      await addDoc(collection(db, 'users', userId, 'history'), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/history`);
    }
  } catch (error) {
    console.error("Failed to save work history:", error);
  }
}

export async function getLocalFile(localId: string): Promise<Blob | null> {
  try {
    return await localforage.getItem<Blob>(localId);
  } catch (error) {
    console.error("Failed to get local file:", error);
    return null;
  }
}


// Use the global firebase object from the CDN scripts
const firebase = (window as any).firebase;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmsoZNCa9ceaNpRKNbJA9soqhygNBmoAw",
  authDomain: "free-fire-pro-58613.firebaseapp.com",
  projectId: "free-fire-pro-58613",
  storageBucket: "free-fire-pro-58613.firebasestorage.app",
  messagingSenderId: "723586708415",
  appId: "1:723586708415:web:fa77a5765e80825bc2a70a",
  measurementId: "G-XH1T96E99V"
};

const CLOUD_NAME = "dizysqhoc";
const UPLOAD_PRESET = "fury_arena_preset";

// --- FIX: Strict Singleton Initialization Pattern ---
let app;

// 1. Check if an app is already initialized to avoid duplication errors
if (firebase.apps.length > 0) {
  app = firebase.app();
} else {
  app = firebase.initializeApp(firebaseConfig);
}

// 2. Initialize Firestore and Auth
const db = app.firestore();
const auth = app.auth();

// 3. Apply Settings Safely
try {
  db.settings({
    ignoreUndefinedProperties: true
  });
} catch (err) {
  console.log("Firestore settings locked, utilizing existing instance.");
}

// 4. Enable Offline Persistence
db.enablePersistence({ synchronizeTabs: true })
  .catch((err: any) => {
    if (err.code === 'failed-precondition') {
        console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.log('Persistence not supported by browser');
    }
  });

export { db, auth, firebase };

// Helper to sanitize large strings
const isLargeString = (str: any) => typeof str === 'string' && str.length > 20000;

export const uploadToCloudinary = async (file: File | string, resourceType: 'image' | 'video' = 'image'): Promise<string> => {
  if (typeof file === 'string' && file.startsWith('http')) return file;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.secure_url;
  } catch (err) {
    console.log("Cloudinary Upload Failed:", err);
    return "https://placehold.co/600x400/1e293b/FFF?text=Image+Upload+Failed";
  }
};

export const handleFirestoreError = (err: any) => {
  if (err.code === 'permission-denied') {
    console.error("FIRESTORE PERMISSION ERROR: Please set your Firestore rules to 'allow read, write: if true;' in the Firebase Console.");
  }
  return { type: 'UNKNOWN', message: err.message || "Database Error" };
};

export const firebaseSaveUser = async (user: any) => {
  if (!user || !user.id) return;
  try {
    const userData = { ...user };
    
    // Clean up large strings before saving
    if (isLargeString(userData.photo)) delete userData.photo;
    if (isLargeString(userData.idPhoto)) delete userData.idPhoto;
    
    if (userData.squadDetails) {
       if (isLargeString(userData.squadDetails.teamLogo)) delete userData.squadDetails.teamLogo;
       if (Array.isArray(userData.squadDetails.members)) {
         userData.squadDetails.members = userData.squadDetails.members.map((m: any) => {
           if (isLargeString(m.photo)) return { ...m, photo: null };
           return m;
         });
       }
    }

    await db.collection("users").doc(user.id).set(userData, { merge: true });
  } catch (err: any) {
    handleFirestoreError(err);
  }
};

export const firebaseGetAllUsers = async () => {
  try {
    const snap = await db.collection("users").get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (err: any) {
    handleFirestoreError(err);
    return [];
  }
};

export const firebaseJoinTournament = async (userId: string, regData: any, entryFee: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = db.collection("users").doc(userId);
    const tournamentRef = db.collection("tournaments").doc(regData.tournamentId);
    
    if (entryFee < 0) entryFee = 0;

    // Sanitize large images
    if (regData.isSquad) {
      if (isLargeString(regData.teamLogo)) regData.teamLogo = "https://placehold.co/100?text=Logo+Size+Err";
      if (Array.isArray(regData.squadMembers)) {
        regData.squadMembers = regData.squadMembers.map((m: any) => ({
          ...m,
          photo: isLargeString(m.photo) ? "https://placehold.co/100?text=Photo+Size+Err" : m.photo
        }));
      }
    } else {
      if (isLargeString(regData.idPhoto)) regData.idPhoto = "https://placehold.co/100?text=Photo+Size+Err";
    }

    const updateData: any = {
      joinedTournament: true,
      lastJoinedTournamentId: regData.tournamentId,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
      diamonds: firebase.firestore.FieldValue.increment(-entryFee),
      cancelReason: null
    };

    if (regData.isSquad) {
      updateData.freeFireId = regData.freeFireId; 
      updateData.idPhoto = regData.teamLogo; 
      updateData.name = regData.teamName; 
      updateData.squadDetails = {
        teamName: regData.teamName,
        teamLogo: regData.teamLogo,
        members: regData.squadMembers
      };
    } else {
      updateData.freeFireId = regData.freeFireId;
      updateData.idPhoto = regData.idPhoto;
    }

    await userRef.set(updateData, { merge: true });
    await tournamentRef.update({
      filledSlots: firebase.firestore.FieldValue.increment(1)
    });

    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err);
    return { success: false, error: err.message };
  }
};

export const firebaseLeaveTournament = async (userId: string, tournamentId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = db.collection("users").doc(userId);
    const tournamentRef = db.collection("tournaments").doc(tournamentId);

    await userRef.update({
      joinedTournament: false,
      lastJoinedTournamentId: null,
      idPhoto: null,
      freeFireId: null,
      squadDetails: null
    });

    await tournamentRef.update({
      filledSlots: firebase.firestore.FieldValue.increment(-1)
    });

    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err);
    return { success: false, error: err.message };
  }
};

export const firebaseGetParticipants = async (tournamentId: string) => {
  try {
    const snap = await db.collection("users")
      .where("joinedTournament", "==", true)
      .where("lastJoinedTournamentId", "==", tournamentId)
      .get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  } catch (err: any) {
    handleFirestoreError(err);
    return [];
  }
};

export const firebaseGetParticipantCount = async (tournamentId: string): Promise<number> => {
  try {
    const snap = await db.collection("users")
      .where("joinedTournament", "==", true)
      .where("lastJoinedTournamentId", "==", tournamentId)
      .get();
    return snap.size; 
  } catch (err: any) {
    handleFirestoreError(err);
    return 0;
  }
};

export const firebaseAddAssets = async (identifier: string, type: 'diamonds' | 'coins', amount: number) => {
  try {
    const cleanIdentifier = String(identifier).trim().toLowerCase();
    
    // Try phone_number first
    let querySnapshot = await db.collection("users").where("phone_number", "==", identifier).get();
    
    // If not found by phone_number, try email
    if (querySnapshot.empty) {
      querySnapshot = await db.collection("users").where("email", "==", cleanIdentifier).get();
    }

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const userData = docSnap.data();
      const userDoc = docSnap.ref;
      const fieldToUpdate = type === 'diamonds' ? 'diamonds' : 'coins';
      await userDoc.update({ [fieldToUpdate]: firebase.firestore.FieldValue.increment(amount) });
      return { success: true, name: userData.name || identifier };
    }
    return { success: false };
  } catch (error: any) {
    handleFirestoreError(error);
    return { success: false };
  }
};

export const firebaseBroadcastNotification = async (title: string, message: string) => {
  try {
    await db.collection("notifications").add({
      title,
      message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err);
    return { success: false };
  }
};

export const firebaseDeductDiamonds = async (userId: string, cost: number) => {
  try {
    const cleanId = String(userId).trim();
    let ref = db.collection("users").doc(cleanId);
    let doc = await ref.get();
    
    if (!doc.exists) {
      const q = await db.collection("users").where("id", "==", cleanId).limit(1).get();
      if (q.empty) return { success: false, error: "User ID not found in database" };
      ref = q.docs[0].ref;
    }
    
    await ref.update({
      diamonds: firebase.firestore.FieldValue.increment(-cost)
    });
    
    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err);
    return { success: false, error: err.message };
  }
};

export const verifyCredentials = async (email: string, password: string) => {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // --- 1. ADMIN PRIORITY ACCESS ---
    if (btoa(cleanEmail) === 'cmFqc2phcm1hOEBnbWFpbC5jb20=' && btoa(password) === 'RlVSWV9BRE1JTl8yMDI1') {
        const legacyAdminId = 'H2CZkc_ADMIN';
        const adminData = {
            id: legacyAdminId,
            email: 'rajsjarma8@gmail.com',
            name: 'Stark Admin',
            password: password, 
            isAdmin: true,
            phone_number: '9999999999',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
            coins: 999999,
            diamonds: 999999
        };

        // Try to sync admin data but don't block login if permissions fail
        try {
          await db.collection("users").doc(legacyAdminId).set(adminData, { merge: true });
        } catch (e: any) {
          handleFirestoreError(e);
        }
        return { success: true, user: adminData };
    }

    // --- 2. STANDARD USER LOGIN ---
    const querySnapshot = await db.collection("users").where("email", "==", cleanEmail).get();

    if (querySnapshot.empty) {
       return { success: false, error: "Account not found. Please Create Account." };
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    if (data.password !== password) {
      return { success: false, error: "Wrong Password" };
    }
    
    return { success: true, user: { id: doc.id, ...data } };

  } catch (err: any) {
    handleFirestoreError(err);
    return { success: false, error: err.message || "Connection Error" };
  }
};

export const checkEmailAvailability = async (email: string) => {
  try {
    const querySnapshot = await db.collection("users").where("email", "==", email).get();
    return querySnapshot.empty;
  } catch (err: any) {
    handleFirestoreError(err);
    return false; 
  }
};

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

// REPLACE THIS with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyA48HNq6dolembHU83A_DesspF-Wf-V9KE",
  authDomain: "community-hero-85f3d.firebaseapp.com",
  databaseURL: "https://community-hero-85f3d-default-rtdb.firebaseio.com",
  projectId: "community-hero-85f3d",
  storageBucket: "community-hero-85f3d.firebasestorage.app",
  messagingSenderId: "683584193693",
  appId: "1:683584193693:web:5a47639bc2189c48fb4074"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection name for issues
export const ISSUES_COLLECTION = "issues";

// Save issue to Firebase
export async function saveIssue(issueData: any) {
  try {
    const docRef = await addDoc(collection(db, ISSUES_COLLECTION), {
      ...issueData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving issue:", error);
    throw error;
  }
}

// Get all issues from Firebase
export async function getIssues() {
  try {
    const querySnapshot = await getDocs(collection(db, ISSUES_COLLECTION));
    return querySnapshot.docs.map((doc: { id: any; data: () => any; }) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting issues:", error);
    throw error;
  }
}

// Update issue status
export async function updateIssueStatus(issueId: string, status: string) {
  try {
    const docRef = doc(db, ISSUES_COLLECTION, issueId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error("Error updating issue:", error);
    throw error;
  }
}

// Delete issue
export async function deleteIssue(issueId: string) {
  try {
    await deleteDoc(doc(db, ISSUES_COLLECTION, issueId));
  } catch (error) {
    console.error("Error deleting issue:", error);
    throw error;
  }
}
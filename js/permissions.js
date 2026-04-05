import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

export async function hasPermission(userId, permissionName) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const role = userSnap.data().role;
      const permissions = userSnap.data().permissions || [];

      if (role === "admin") return true;

      return permissions.includes(permissionName);
    }
    return false;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

export async function getUserRole(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().role || "user";
    }
    return "user";
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

export async function getUserPermissions(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().permissions || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

export async function addPermission(userId, permissionName) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      permissions: arrayUnion(permissionName)
    });
    return true;
  } catch (error) {
    console.error("Error adding permission:", error);
    return false;
  }
}

export async function removePermission(userId, permissionName) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      permissions: arrayRemove(permissionName)
    });
    return true;
  } catch (error) {
    console.error("Error removing permission:", error);
    return false;
  }
}

export async function updateUserRole(userId, newRole) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      role: newRole
    });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
}

export const PERMISSIONS = {
  VIEW_TASKS: "view_tasks",
  EDIT_TASKS: "edit_tasks",
  DELETE_TASKS: "delete_tasks",
  VIEW_TEAM: "view_team",
  EDIT_TEAM: "edit_team",
  VIEW_UPLOADS: "view_uploads",
  UPLOAD_FILES: "upload_files",
  DELETE_FILES: "delete_files"
};

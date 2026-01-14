"use server";

import { db } from "@/firebase/admin";
import { revalidatePath } from "next/cache";

interface UpdateUserProfileParams {
  userId: string;
  name?: string;
  profileURL?: string;
  removeProfileURL?: boolean;
}

export async function updateUserProfile({
  userId,
  name,
  profileURL,
  removeProfileURL,
}: UpdateUserProfileParams) {
  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (profileURL) updateData.profileURL = profileURL;
    if (removeProfileURL) updateData.profileURL = null;

    if (Object.keys(updateData).length === 0) {
      return { success: false, message: "No data provided to update" };
    }

    await db.collection("users").doc(userId).set(updateData, { merge: true });

    revalidatePath("/profile");
    revalidatePath("/interview");
    revalidatePath("/");

    return { success: true, message: "Profile updated successfully" };
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return { success: false, message: "Failed to update profile" };
  }
}

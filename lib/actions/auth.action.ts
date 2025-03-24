"use server";

import { db, auth } from "@/firebase/admin";
import { cookies } from "next/headers";
const ONE_WEEK = 60 * 60 * 24 * 7;
// remember a actions file always runs on the server side
export async function signup(params: SignUpParams) {
  // Getting the credentials  from the user
  const { uid, name, email } = params;
  try {
    // cheking if the user already exists  or not
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists) {
      return {
        success: false,
        message: "User already exists.Please sign in instead",
      };
    }
    // if the user does not exist then we create the doc for the user and store it in the db
    await db.collection("users").doc(uid).set({
      name,
      email,
    });
    return {
      success: true,
      message: "Account created successfullly!,Please sign in",
    };
  } catch (error: any) {
    console.error("Error creating the user", error);
    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }
    return {
      success: true,
      message: "Failed to create an account",
    };
  }
}
export async function signin(params: SignInParams) {
  const { email, idToken } = params;
  // Getting the credentials from the user
  try {
    const userRecord = await auth.getUserByEmail(email);
    // check if the user exists on our database or not then and then only create a cookie session
    if (!userRecord) {
      return {
        success: false,
        Message: "User does not exist.Create an account instead",
      };
    }
    await setSessionCookie(idToken);
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Failed to log into an account.",
    };
  }
}

// This function creates and sets the cookie of the user on the web
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();
  const sessionCookie = await auth.createSessionCookie(idToken, {
    // 1 week
    expiresIn: ONE_WEEK * 1000,
  });
  cookieStore.set("Session", sessionCookie, {
    maxAge: ONE_WEEK,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionCookie = (await cookieStore).get("Session")?.value;
  console.log("Session Cookie", sessionCookie);
  if (!sessionCookie) return null;
  try {
    // verifying the session cookie on the server
    const docodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    // console.log("The is the Decoded Claims!!", docodedClaims);
    // trying to get the userRecord on the basis of the decoded cookie ==> which  means that the user exists
    const userRecord = await db
      .collection("users")
      .doc(docodedClaims.uid)
      .get();
    if (!userRecord.exists) return null;
    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  //   console.log("user first...", user);
  //   console.log("user second...", !user);
  return !!user;
}

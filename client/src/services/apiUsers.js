import { AUTH_EP, SERVER_URL, USERS_EP } from "../utils/constants";

//auth user
export async function getMe() {
    const res = await fetch(`${SERVER_URL}/${AUTH_EP}/me`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

//Login Logout
export async function loginUser({ email, password }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/login`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function logoutUser() {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/logout`, {
        method: "POST",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
//end

//signup
export async function createUser({ email, password, name }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/register`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
export async function verifyNewUser({ token }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/register/verify/${token}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
//end

//forgot
export async function forgotUserPassword({ email }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/forgot`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
export async function verifyUserForgetCode({ email, code }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/verify-recovery-code`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
export async function resetUserPasswordByToken({ password }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/reset`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
//end

//getters:
export async function getAllUsers() {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/all`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
export async function getUser({ id }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/${id}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
export async function getUserSettings({ id }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/${id}/settings`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
//end


//Updates 
export async function updateUserNameOrEmail({ name, email, id }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/info/${id}`, {
        method: "PATCH",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function updateUserPassword({ oldPassword, newPassword, id }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/password/${id}`, {
        method: "PATCH",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function updateUserRole({ role, id }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/role/${id}`, {
        method: "PATCH",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function updateUserSettings({ isDark = null, notifications = null, alertLevel = null, timezone = null, appLanguage = null, userId }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/${userId}/settings`, {
        method: "PATCH",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDark, notifications, alertLevel, timezone, appLanguage }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}


//end


//deletion
export async function deleteUser({ id }) {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/user/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function deleteAccount() {
    const res = await fetch(`${SERVER_URL}/${USERS_EP}/account`, {
        method: "DELETE",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}




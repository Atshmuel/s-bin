import { AUTH_EP, USERS_EP } from "../utils/constants";
import { request } from "./request";

//auth user
export function getMe() {
    return request(`${AUTH_EP}/me`);
}

//Login Logout
export function loginUser({ email, password }) {
    return request(`${USERS_EP}/login`, { method: "POST", body: { email, password } });
}

export function logoutUser() {
    return request(`${USERS_EP}/logout`, { method: "POST" });
}
//end

//signup
export function createUser({ email, password, name }) {
    return request(`${USERS_EP}/register`, { method: "POST", body: { email, password, name } });
}

export function verifyNewUser({ token }) {
    return request(`${USERS_EP}/register/verify/${token}`);
}
//end

//forgot
export function forgotUserPassword({ email }) {
    return request(`${USERS_EP}/forgot`, { method: "POST", body: { email } });
}

export function verifyUserForgetCode({ email, code }) {
    return request(`${USERS_EP}/verify-recovery-code`, { method: "POST", body: { email, code } });
}

export function resetUserPasswordByToken({ password }) {
    return request(`${USERS_EP}/reset`, { method: "POST", body: { password } });
}
//end

//getters:
export function getAllUsers() {
    return request(`${USERS_EP}/all`);
}

export function getUser({ id }) {
    return request(`${USERS_EP}/${id}`);
}

export function getUserSettings({ id }) {
    return request(`${USERS_EP}/${id}/settings`);
}

export function getOrgManagers({ org }) {
    return request(org ? `${USERS_EP}/managers/${org}` : `${USERS_EP}/managers`);
}
//end

//Updates
export function updateUserNameOrEmail({ name, email, id }) {
    return request(`${USERS_EP}/info/${id}`, { method: "PATCH", body: { name, email } });
}

export function updateUserPassword({ oldPassword, newPassword, id }) {
    return request(`${USERS_EP}/password/${id}`, { method: "PATCH", body: { oldPassword, newPassword } });
}

export function updateUserRole({ role, id }) {
    return request(`${USERS_EP}/role/${id}`, { method: "PATCH", body: { role } });
}

export function updateUserStatus({ status, id }) {
    return request(`${USERS_EP}/status/${id}`, { method: "PATCH", body: { status } });
}

export function updateUserOrgAndManager({ userId, org, manager }) {
    return request(`${USERS_EP}/managerAndOrg/${userId}`, { method: "PATCH", body: { org, manager } });
}

export function updateUserSettings(settings, userId) {
    return request(`${USERS_EP}/${userId}/settings`, { method: "PATCH", body: settings });
}
//end

//deletion
export function deleteUserById({ id }) {
    return request(`${USERS_EP}/user/${id}`, { method: "DELETE" });
}

export function deleteAccount() {
    return request(`${USERS_EP}/account`, { method: "DELETE" });
}

//admin create user
export function createUserAsAdmin({ email, password, name, role, status, org, manager }) {
    return request(`${USERS_EP}/admin/register`, {
        method: "POST",
        body: { email, password, name, role, status, org, manager },
    });
}

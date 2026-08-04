// sessionStorage is scoped to a single browser tab (unlike localStorage or
// cookies, which are shared by every tab of the same browser). Storing the
// auth token here — rather than relying solely on the shared cookie — is
// what lets someone open a fresh tab, log in as a different user, and have
// both sessions stay independent at the same time.
const TOKEN_KEY = "cs_auth_token";

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

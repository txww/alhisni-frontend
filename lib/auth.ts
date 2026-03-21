export const saveSession = (jwt: string) => {
  localStorage.setItem("jwt", jwt);
  document.cookie = `jwt=${jwt}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
};

export const clearSession = () => {
  localStorage.removeItem("jwt");
  localStorage.removeItem("user");
  document.cookie = "jwt=; path=/; max-age=0";
};

export const getJwt = () => localStorage.getItem("jwt") || "";
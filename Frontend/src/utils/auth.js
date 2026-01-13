export const clearAuth = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  } catch {}
};

export const forceLogout = () => {
  clearAuth();
  // Use hard redirect to avoid any router guard collisions or stale state
  window.location.replace("/login");
};

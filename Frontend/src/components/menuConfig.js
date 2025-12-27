import { LayoutDashboard, Shield, RefreshCcw, Bell, User } from "lucide-react";

export const getMenuByRole = (role) => {
  const primary = {
    DATA_PRINCIPAL: [
      {
        to: "/data-principal",
        label: "Dashboard Overview",
        icon: LayoutDashboard,
      },
      { to: "/my-consents", label: "My Consents", icon: Shield },
      { to: "/update-withdraw", label: "Update / Withdraw", icon: RefreshCcw },
    ],
    DATA_FIDUCIARY: [
      {
        to: "/data-fiduciary",
        label: "Dashboard Overview",
        icon: LayoutDashboard,
      },
      // Add more fiduciary links here
    ],
    DATA_PROCESSOR: [
      {
        to: "/data-processor",
        label: "Dashboard Overview",
        icon: LayoutDashboard,
      },
      // Add more processor links here
    ],
    ADMIN: [
      { to: "/admin", label: "Dashboard Overview", icon: LayoutDashboard },
      // Add more admin links here
    ],
  };

  const secondary = {
    DATA_PRINCIPAL: [
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/profile", label: "Profile & Security", icon: User },
    ],
    DATA_FIDUCIARY: [],
    DATA_PROCESSOR: [],
    ADMIN: [],
  };

  const r = role || "DATA_PRINCIPAL";
  return {
    primary: primary[r] || primary.DATA_PRINCIPAL,
    secondary: secondary[r] || [],
  };
};

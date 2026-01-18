import {
  LayoutDashboard,
  Shield,
  Database,
  Bell,
  User,
  Users,
} from "lucide-react";

export const getMenuByRole = (role) => {
  const primary = {
    DATA_PRINCIPAL: [
      {
        to: "/data-principal",
        label: "Dashboard Overview",
        icon: LayoutDashboard,
      },
      { to: "/my-consents", label: "My Consents", icon: Shield },
      { to: "/accept-consent", label: "Accept Consent", icon: Database },
    ],
    DATA_FIDUCIARY: [
      {
        to: "/data-fiduciary",
        label: "Dashboard Overview",
        icon: LayoutDashboard,
      },
      { to: "/fiduciary/consents", label: "All Consents", icon: Shield },
      {
        to: "/fiduciary/data-principals",
        label: "Data Principals",
        icon: Users,
      },
      {
        to: "/fiduciary/processors",
        label: "Data Processors",
        icon: Database,
      },
    ],
    DATA_PROCESSOR: [
      {
        to: "/data-processor",
        label: "Dashboard Overview",
        icon: LayoutDashboard,
      },
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
    DATA_FIDUCIARY: [
      { to: "/fiduciary/notifications", label: "Notifications", icon: Bell },
      { to: "/fiduciary/profile", label: "Profile & Security", icon: User },
    ],
    DATA_PROCESSOR: [],
    ADMIN: [],
  };

  const r = role || "DATA_PRINCIPAL";
  return {
    primary: primary[r] || primary.DATA_PRINCIPAL,
    secondary: secondary[r] || [],
  };
};

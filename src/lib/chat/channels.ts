import type { ChatChannelDef } from "@/types";

/** Fixed channels for the portal. Operations and Shop Floor are operational; Announcements is CEO-led. */
export const CHAT_CHANNELS: ChatChannelDef[] = [
  {
    key: "operations",
    name: "Operations",
    description: "Scheduling, pickups, coordination",
    allowedRoles: ["ceo", "receptionist"],
  },
  {
    key: "shop_floor",
    name: "Shop Floor",
    description: "Execution, blockers, workflow issues",
    allowedRoles: ["ceo", "receptionist", "technician"],
  },
  {
    key: "announcements",
    name: "Announcements",
    description: "Important updates from leadership",
    allowedRoles: ["ceo", "receptionist", "technician"],
    announceOnly: true,
  },
];

export function getChannelByKey(key: string): ChatChannelDef | undefined {
  return CHAT_CHANNELS.find((c) => c.key === key);
}

export function getChannelsForRole(role: "ceo" | "receptionist" | "technician"): ChatChannelDef[] {
  return CHAT_CHANNELS.filter((c) => c.allowedRoles.includes(role));
}

export function canPostInChannel(
  channelKey: string,
  role: "ceo" | "receptionist" | "technician"
): boolean {
  const ch = getChannelByKey(channelKey);
  if (!ch) return false;
  if (!ch.allowedRoles.includes(role)) return false;
  if (ch.announceOnly) return role === "ceo";
  return true;
}

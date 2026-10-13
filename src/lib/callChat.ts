/**
 * Call events in the order chat.
 *
 * The backend stores each call outcome as a SYSTEM chat message whose `content`
 * is `::call::` followed by a JSON payload. This module detects and describes
 * those messages so the chat UI can render a Messenger-style call pill instead
 * of raw JSON.
 */

export const CALL_CHAT_PREFIX = "::call::";

export type CallChatEvent =
    | "NO_ANSWER" // ringing timed out
    | "CANCELLED" // caller hung up before it was answered
    | "DECLINED" // receiver rejected the call
    | "BUSY" // receiver was already on another call
    | "ENDED"; // call was answered and then finished

export type CallDirection = "user-to-shop" | "shop-to-user";

export interface CallChatPayload {
    callId?: string;
    event: CallChatEvent;
    direction: CallDirection;
    durationSec: number;
}

const KNOWN_EVENTS: ReadonlySet<string> = new Set([
    "NO_ANSWER",
    "CANCELLED",
    "DECLINED",
    "BUSY",
    "ENDED",
]);

/** Returns the parsed call payload, or null when `content` is not a call event. */
export function parseCallChat(content?: string | null): CallChatPayload | null {
    if (!content || !content.startsWith(CALL_CHAT_PREFIX)) return null;
    try {
        const raw = JSON.parse(content.slice(CALL_CHAT_PREFIX.length));
        if (!raw || typeof raw.event !== "string" || !KNOWN_EVENTS.has(raw.event)) {
            return null;
        }
        return {
            callId: typeof raw.callId === "string" ? raw.callId : undefined,
            event: raw.event as CallChatEvent,
            direction: raw.direction === "shop-to-user" ? "shop-to-user" : "user-to-shop",
            durationSec: Number.isFinite(raw.durationSec) ? Math.max(0, raw.durationSec) : 0,
        };
    } catch {
        return null;
    }
}

/** 135 -> "02:15", 3725 -> "1:02:05". */
export function formatCallDuration(totalSeconds: number): string {
    const s = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(sec).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export type CallChatTone = "missed" | "ended";

export interface CallChatDescription {
    title: string;
    subtitle: string;
    tone: CallChatTone;
}

/**
 * Neutral wording for the web admin, which sees both sides of the conversation
 * (the mobile apps use first-person wording instead).
 */
export function describeCallChat(call: CallChatPayload): CallChatDescription {
    const caller = call.direction === "user-to-shop" ? "Customer" : "Shop";
    const callee = call.direction === "user-to-shop" ? "shop" : "customer";

    switch (call.event) {
        case "NO_ANSWER":
            return {
                title: "Missed call",
                subtitle: `${caller} called · ${callee} didn't answer`,
                tone: "missed",
            };
        case "CANCELLED":
            return {
                title: "Missed call",
                subtitle: `${caller} hung up before it was answered`,
                tone: "missed",
            };
        case "DECLINED":
            return {
                title: "Call declined",
                subtitle: `${caller} called · ${callee} declined`,
                tone: "missed",
            };
        case "BUSY":
            return {
                title: "Line busy",
                subtitle: `${caller} called · ${callee} was on another call`,
                tone: "missed",
            };
        case "ENDED":
        default:
            return {
                title: "Call ended",
                subtitle: `${caller} called · ${formatCallDuration(call.durationSec)}`,
                tone: "ended",
            };
    }
}

// Authentication state — shared globally for card-reader login

export interface AuthUser {
  name: string;
  role: string;
  avatar: string;
}

const loggedIn = ref(false);
const currentUser = ref<AuthUser | null>(null);

const SESSION_KEY = "classboard_auth_session_v1";
const PERMANENT_KEY = "classboard_auth_permanent_v1";

function loadFromStorage(): void {
  if (import.meta.server) return;
  try {
    // Try permanent first, then session
    let raw = localStorage.getItem(PERMANENT_KEY);
    let permanent = true;
    if (!raw) {
      raw = sessionStorage.getItem(SESSION_KEY);
      permanent = false;
    }
    if (raw) {
      const data = JSON.parse(raw) as AuthUser;
      currentUser.value = data;
      loggedIn.value = true;
      _isPermanent = permanent;
    }
  } catch {
    /* ignore */
  }
}
let _isPermanent = false;

// Initialize from storage on first import
if (import.meta.client) {
  loadFromStorage();
}

export function useAuth() {
  /** Query card without logging in — returns user info if valid. */
  async function lookupCard(cardId: string): Promise<{ ok: boolean; message: string; user?: AuthUser }> {
    if (import.meta.server) return { ok: false, message: "仅在客户端可用" };
    try {
      const res = await $fetch<{
        ok: boolean;
        message?: string;
        user?: AuthUser;
      }>("/api/card-auth", { query: { card: cardId } });

      if (res.ok && res.user) {
        return { ok: true, message: "", user: res.user };
      }
      return { ok: false, message: res.message || "未识别的卡号" };
    } catch {
      return { ok: false, message: "验证失败，请检查网络" };
    }
  }

  /** Confirm login with the looked-up user. */
  function confirmLogin(user: AuthUser, permanent: boolean): void {
    currentUser.value = user;
    loggedIn.value = true;
    _isPermanent = permanent;
    if (permanent) {
      localStorage.setItem(PERMANENT_KEY, JSON.stringify(user));
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      localStorage.removeItem(PERMANENT_KEY);
    }
  }

  function logout(): void {
    currentUser.value = null;
    loggedIn.value = false;
    _isPermanent = false;
    localStorage.removeItem(PERMANENT_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isPermanent(): boolean {
    return _isPermanent;
  }

  return {
    loggedIn,
    currentUser,
    isPermanent,
    lookupCard,
    confirmLogin,
    logout,
  };
}

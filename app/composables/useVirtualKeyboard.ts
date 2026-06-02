// Virtual keyboard state — shared globally

export type KeyboardMode = "en" | "num" | "cn" | "jp";

const keyboardVisible = ref(false);
const keyboardMode = ref<KeyboardMode>("en");
const shiftLock = ref(false);
const jpKanaMode = ref<"hiragana" | "katakana">("hiragana");
const composing = ref(""); // Current IME composition string (pinyin/romaji in progress)
const lastCommitted = ref(""); // Last committed Chinese character for 联想 prediction
let activeInput: HTMLInputElement | HTMLTextAreaElement | null = null;

function isEditable(el: HTMLElement): el is HTMLInputElement | HTMLTextAreaElement {
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA";
}

export function useVirtualKeyboard() {
  function showKeyboard(el: HTMLElement) {
    if (!isEditable(el)) return;
    activeInput = el;
    keyboardVisible.value = true;
  }

  function hideKeyboard() {
    activeInput = null;
    keyboardVisible.value = false;
    composing.value = "";
    lastCommitted.value = "";
  }

  function insertAtCursor(text: string) {
    if (!activeInput) return;
    const el = activeInput;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    const newPos = start + text.length;
    el.setSelectionRange(newPos, newPos);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function insertText(text: string) {
    if (!activeInput) return;
    if (keyboardMode.value === "cn") {
      // Chinese: build pinyin, show candidates
      composing.value += text.toLowerCase();
      return;
    }
    if (keyboardMode.value === "jp") {
      // Japanese: build romaji, convert via composable
      composing.value += text.toLowerCase();
      return;
    }
    insertAtCursor(keyboardMode.value === "en" && shiftLock.value ? text.toUpperCase() : text);
    shiftLock.value = false;
    // Non-CN/JP mode: clear prediction context
    lastCommitted.value = "";
  }

  function commitComposition(text: string) {
    if (!activeInput) return;
    insertAtCursor(text);
    composing.value = "";
    shiftLock.value = false;
    // Track the last committed character(s) for 联想 prediction
    if (keyboardMode.value === "cn" && text.length >= 1) {
      lastCommitted.value = (lastCommitted.value + text).slice(-2);
    }
  }

  function commitPrediction(text: string) {
    if (!activeInput) return;
    // Strip prefix already committed (e.g. "人" + prediction "人工智能" → insert "工智能")
    let toInsert = text;
    if (lastCommitted.value && text.startsWith(lastCommitted.value)) {
      toInsert = text.slice(lastCommitted.value.length);
    }
    if (toInsert) {
      insertAtCursor(toInsert);
    }
    // Track last 2 chars of the full predicted word for chain prediction
    if (text.length >= 1) {
      lastCommitted.value = text.slice(-2);
    }
  }

  function cancelComposition() {
    if (composing.value && activeInput) {
      // For JP mode, insert the raw romaji; for CN, insert raw pinyin
      insertAtCursor(composing.value);
    }
    composing.value = "";
  }

  function clearPrediction() {
    lastCommitted.value = "";
  }

  function backspace() {
    if (!activeInput) return;
    if (composing.value) {
      composing.value = composing.value.slice(0, -1);
      return;
    }
    const el = activeInput;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    if (start === end && start > 0) {
      el.value = el.value.slice(0, start - 1) + el.value.slice(start);
      el.setSelectionRange(start - 1, start - 1);
    } else if (start !== end) {
      el.value = el.value.slice(0, start) + el.value.slice(end);
      el.setSelectionRange(start, start);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    // Clear prediction when deleting actual text
    lastCommitted.value = "";
  }

  async function pasteFromClipboard() {
    if (!activeInput) return;
    composing.value = "";
    try {
      const text = await navigator.clipboard.readText();
      if (text) insertAtCursor(text);
    } catch {}
  }

  function submit() {
    if (!activeInput) return;
    cancelComposition();
    activeInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    activeInput.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
    hideKeyboard();
  }

  function toggleShift() {
    shiftLock.value = !shiftLock.value;
  }

  function toggleKanaMode() {
    jpKanaMode.value = jpKanaMode.value === "hiragana" ? "katakana" : "hiragana";
  }

  function setMode(mode: KeyboardMode) {
    cancelComposition();
    keyboardMode.value = mode;
    shiftLock.value = false;
  }

  function cycleMode() {
    cancelComposition();
    const order: KeyboardMode[] = ["en", "cn", "jp"];
    const idx = order.indexOf(keyboardMode.value);
    keyboardMode.value = order[(idx + 1) % order.length];
    shiftLock.value = false;
  }

  return {
    keyboardVisible, keyboardMode, shiftLock, jpKanaMode, composing, lastCommitted,
    showKeyboard, hideKeyboard,
    insertText, insertAtCursor, commitComposition, commitPrediction, cancelComposition, clearPrediction,
    backspace, pasteFromClipboard, submit,
    toggleShift, toggleKanaMode, setMode, cycleMode,
  };
}

// Virtual keyboard state — shared globally

const keyboardVisible = ref(false);
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
  }

  function insertText(text: string) {
    if (!activeInput) return;
    const el = activeInput;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    const newPos = start + text.length;
    el.setSelectionRange(newPos, newPos);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function backspace() {
    if (!activeInput) return;
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
  }

  async function pasteFromClipboard() {
    if (!activeInput) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) insertText(text);
    } catch {
      // clipboard not available
    }
  }

  function submit() {
    if (!activeInput) return;
    activeInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    activeInput.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
    hideKeyboard();
  }

  return {
    keyboardVisible,
    showKeyboard,
    hideKeyboard,
    insertText,
    backspace,
    pasteFromClipboard,
    submit,
  };
}

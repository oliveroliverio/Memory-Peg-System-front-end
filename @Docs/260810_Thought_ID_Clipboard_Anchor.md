# Implementation Plan: Thought ID Clipboard Anchor Feature

**Date**: 2026-08-10  
**Target File**: `public/index.html`, `public/style.css`, `public/app.js`

---

## 1. Overview & Objective

The goal is to add a quick-action button in the Memory Peg System web application that allows users to create and copy a standardized memory anchor called `thought_id`. 

When the user clicks the button:
1. They are prompted to input their `current_location` (e.g., `home_office`, `living_room`, `cafe`).
2. A timestamped `thought_id` variable is generated in the exact format:
   ```text
   YYMMDD-HHMMSS_<current_location>
   ```
   *Example*: `260810-085431_home_office`
3. The generated string is copied directly to the system clipboard of whatever device (desktop, mobile, tablet) the webapp is running on.
4. Visual confirmation (toast message + button feedback) is shown to the user.

---

## 2. Technical Architecture & Clipboard Strategy

### Clipboard API & Cross-Device Fallback
Browser access to the system clipboard (`navigator.clipboard.writeText`) requires a secure context (`https://` or `localhost`) and an active user gesture. On older mobile browsers, webviews, or HTTP local networks (such as a Raspberry Pi deployment over local IP `http://192.168.x.x`), `navigator.clipboard` may fail or be `undefined`.

**Strategy**:
1. Try `navigator.clipboard.writeText(text)` asynchronously.
2. If `navigator.clipboard` is missing or rejects with a `NotAllowedError` / DOMException, execute synchronous fallback:
   - Append a temporary off-screen `<textarea>` to `document.body`.
   - Select text with `.select()` and `.setSelectionRange()`.
   - Invoke `document.execCommand('copy')`.
   - Remove element.

### User Experience & Location Persistence
- **Sleek Modal Input**: A theme-matched dark glass modal dialog (`#thought-id-modal`) will appear when clicking "📌 Copy Thought ID".
- **Default Prompt Fallback**: Provides both standard `window.prompt()` fallback and custom modal.
- **LocalStorage Pre-fill**: The last entered location is saved in `localStorage.setItem('last_thought_location', location)`, making repeated clicks instant (press Enter or tap Copy).
- **Sanitization**: Whitespace is trimmed, and spaces are automatically converted to underscores `_` to ensure clean anchors for journaling and tags (e.g. `living room` -> `living_room`).

---

## 3. Step-by-Step Implementation Steps

### Step 1: HTML Structure (`public/index.html`)
- Add `#copy-thought-id-btn` to the hero banner subtitle section.
- Add `#thought-id-modal` modal overlay for location prompt.
- Add `#toast-container` container for floating notifications.

### Step 2: Styling (`public/style.css`)
- Style the `📌 Copy Thought ID` button with subtle glassmorphism background, hover glow, and theme colors.
- Style modal card with smooth backdrop-filter, rounded corners, themed input field, and buttons.
- Style toast notifications for copy feedback.

### Step 3: JS Logic (`public/app.js`)
- Implement `formatThoughtId(location, dateObj)` formatting logic.
- Implement `copyTextToClipboard(text)` with `navigator.clipboard` and `document.execCommand('copy')` fallback.
- Handle modal open/close, Enter key triggers, and toast notifications.

---

## 4. Verification & Testing Plan

1. **Format Validation**:
   - Verify `thought_id` follows `YYMMDD-HHMMSS_<current_location>` (e.g. 2-digit year `26`, 2-digit month `08`, 2-digit day `10`, hyphen, 2-digit hour `08`, 2-digit minute `54`, 2-digit second `31`, underscore, location).
2. **Clipboard Copy Verification**:
   - Test copying on browser environment.
   - Verify fallback mechanism handles non-secure contexts.
3. **UX Verification**:
   - Verify location pre-fill from `localStorage`.
   - Verify Enter key triggers copy and Escape closes modal.
   - Verify toast message appears and disappears cleanly.

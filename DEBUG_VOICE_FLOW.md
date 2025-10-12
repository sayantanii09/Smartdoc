# Voice Flow Debugging Guide

## How to Test and Capture Logs

### Test Steps:
1. Open the app in browser (Chrome recommended)
2. Open Developer Console (F12 or Cmd+Option+I)
3. Go to Console tab
4. Login with `drsmith` / `password123`
5. Scroll down to "Symptoms" section
6. Click "Voice Input" button for Symptoms
7. **Speak**: "fever and cough" (or any symptom)
8. **Wait** for it to appear in the Symptoms field
9. **Speak**: "NEXT" or "next"
10. **Observe**: The banner should change to "Step 2 of 13: Past Medical History"
11. **Immediately speak**: "diabetes" (or any medical history)
12. **Check**: Where did "diabetes" appear? Symptoms or Past Medical History?

### Expected Console Logs:

When you say "fever and cough":
```
🎤 Voice captured: fever and cough
🔍 READING guidedFlowStepRef.current = 0
🔍 Current step: Symptoms Step #: 0
📝 CAPTURE CALLED: guidedFlowStepRef.current = 0
📝 Capturing "fever and cough" to field: symptoms (Step 0)
📌 Field name from step: "symptoms"
📌 Setter found: YES
✅ Called setter for field: symptoms
✅ Updated symptoms
```

When you say "NEXT":
```
🎤 Voice captured: next
🔍 READING guidedFlowStepRef.current = 0
⏭️ NEXT command detected - moving to next field
➡️ Moving to next step from: 0 Ref before: 0
✅ Moved to step: 1 Past Medical History
📌 CRITICAL: guidedFlowStepRef.current NOW = 1
📌 VERIFY: Reading ref again = 1
📍 Scrolled to: Past Medical History
```

When you say "diabetes":
```
🎤 Voice captured: diabetes
🔍 READING guidedFlowStepRef.current = 1    <-- THIS SHOULD BE 1, NOT 0
🔍 Current step: Past Medical History Step #: 1
📝 CAPTURE CALLED: guidedFlowStepRef.current = 1
📝 Capturing "diabetes" to field: pastMedicalHistory (Step 1)
📌 Field name from step: "pastMedicalHistory"
📌 Setter found: YES
✅ Called setter for field: pastMedicalHistory
✅ Updated past medical history
```

### What to Look For:

**If the bug occurs**, the logs when you say "diabetes" will show:
- guidedFlowStepRef.current = 0 (WRONG! Should be 1)
- Current step: Symptoms (WRONG! Should be Past Medical History)
- Field: symptoms (WRONG! Should be pastMedicalHistory)

**Please copy ALL console logs from steps 7-12** and share them.

### Quick Visual Check:
- After saying "NEXT", the Past Medical History section should have a GREEN border (ACTIVE badge)
- When you say "diabetes", it should appear in the Past Medical History textarea, NOT in Symptoms

## Current Issue:
User reports: "next command isn't working after one time. the next field is showing activated but when saying something, it is getting autopopulated in the previous field"

This means:
- ✅ Visual UI updates correctly (green border on correct field)
- ❌ Voice input goes to wrong field

This suggests the ref is not being updated, OR the speech recognition handler is using cached/stale values.

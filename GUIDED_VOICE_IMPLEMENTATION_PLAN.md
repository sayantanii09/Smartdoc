# Guided Voice Documentation System - Implementation Plan

## Complete Specification

### Interactive Voice Flow (ALL fields: voice + manual)
1. **Symptoms** (voice + manual)
2. **Past Medical History** (voice + manual)
3. **Family History** (voice + manual)
4. **Social History** (voice + manual)
5. **Current Medication** (voice + manual)
6. **Allergy** (voice + manual)
7. **Vitals** (voice + manual) - BP, Temperature, Pulse, etc.
8. **Diagnosis** (voice + manual)
9. **Prescription** (voice + manual with sub-flow):
   - Medicine name
   - Dosage form
   - Dose
   - Route
   - Frequency
   - Duration
   - Food instruction
   - "Add another medicine?"
10. **Lab Test** (voice + manual)
11. **Advice** (voice + manual)
12. **Referrals** (voice + manual)
13. **Follow Up** (voice + manual)

### Voice Commands (work at any step)
- **"SKIP"** = skip current field, move to next
- **"Previous"** = go back one field
- **"ADD"** = append to current field (don't replace)
- **"Next"** = move to next field

### Floating Transcript Widget
- Shows: "Current Prompt: [prompt]" + "You said: [live transcript]"
- Positioned to avoid overlapping (bottom-right or top-right)
- Collapsible/Expandable
- Transcript is editable

### UI Changes
- Remove old free-form transcription completely
- Rearrange sections to match flow order
- Active field highlights + auto-scroll
- Progress indicator (Step X of 13)

## Implementation Steps

### Phase 1: State Management
- [ ] Create `guidedFlowStep` state (0-12)
- [ ] Create `currentPrompt` state
- [ ] Create `isGuidedMode` state (always true - no toggle)
- [ ] Create prescription sub-step state
- [ ] Create field completion tracking

### Phase 2: Voice Recognition Refactor
- [ ] Replace extraction logic with simple direct capture
- [ ] Add voice command detection (SKIP, Previous, ADD, Next)
- [ ] Implement step-by-step prompts
- [ ] Handle prescription sub-flow

### Phase 3: UI Restructure
- [ ] Rearrange sections in correct order
- [ ] Add progress indicator component
- [ ] Add field highlighting for active step
- [ ] Implement auto-scroll to active field
- [ ] Add voice + manual buttons for each field

### Phase 4: Floating Widget
- [ ] Create FloatingTranscript component
- [ ] Position dynamically
- [ ] Add collapse/expand
- [ ] Make transcript editable

### Phase 5: Testing
- [ ] Test full flow end-to-end
- [ ] Test voice commands
- [ ] Test navigation (Previous, SKIP)
- [ ] Test prescription sub-flow

## Critical Implementation Notes
- NO extraction patterns - direct capture only
- Clean state machine for flow
- Clear visual feedback for current step
- Robust voice command parsing
- Preserve existing patient storage, templates, EHR features

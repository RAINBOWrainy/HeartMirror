# TODOS

Organized by component/skill, with priority P0 (critical) → P4 (nice-to-have).

## Diary

**Priority: P1**
- Extract duplicated tag selection UI from `Diary.tsx` to new reusable `components/Diary/TagSelector.tsx` component
- Update `Diary.tsx` create and edit modals to use the new `TagSelector` component
- Add user-facing error notifications (toast) for diary create/update/delete failures (currently only logged to console)
- Create `components/Diary/TagSelector.test.tsx` with unit tests verifying toggle behavior

## Chat

**Priority: P1**
- Implement query parameter reading in `Chat.tsx` to get initial mood from `?mood=` URL parameter and use it as context for the chat session

## Completed

*(empty)*

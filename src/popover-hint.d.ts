// popover="hint" and interestfor are valid HTML attributes but not yet in
// TypeScript's DOM lib or Svelte's element types.
//
// Svelte-check doesn't pick up module augmentation for its built-in element types,
// so we use inline casts in templates:
//   popover={'hint' as 'auto'}
//   {...{ interestfor: 'id' }}
//
// This file exists as documentation. Remove the casts once svelte/elements
// adds "hint" to the popover union and recognizes interestfor.
//
// Spec references:
//   https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using#using_hint_popover_state
//   https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using_interest_invokers

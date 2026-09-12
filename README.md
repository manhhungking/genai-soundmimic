# GenAI Sound Mimic

A new, playful sound-classification experience for young learners. This project follows the proven React/Vite/TypeScript foundations used by GenAI Teachable Machine while keeping its product UI and domain independent.

## Development

```bash
npm install
npm run dev
```

Use `npm run build`, `npm run lint`, and `npm test` before shipping changes.

## Shared foundations

- `@genai-fi/base` provides the shared Generation AI foundations.
- `@genai-fi/classifier` is isolated behind a dynamic import so ML code can be loaded only when a training or prediction flow needs it.
- The homepage is intentionally UI-only and does not initialize TensorFlow.

## Routes

- `/` — join a class or create a teacher session.
- `/home` — child-friendly product overview and activity map.
- `/train` — editable sound classes, sample collection, classifier training, and live preview.
- `/play` — student recording, playback, turn order, and AI guess view.
- `/results` — per-round AI predictions, with optional XAI evidence controlled by the host.
- `/xai` — redirects to `/results` for backwards compatibility.

The current workspace is the teacher/host experience. The streamlined student experience will be implemented separately.

Colors are managed through reusable design tokens in `src/theme.css`. The Light/Dark selector follows the learner's system preference on first visit and remembers later changes locally.

## Localization

UI copy lives in `src/locales`. English is the fallback and first-visit default; the other Teachable Machine language options are lazy-loaded when selected. The chosen language is stored locally and restored on the next visit.

## License

MIT, matching GenAI Teachable Machine. See [LICENSE](./LICENSE).

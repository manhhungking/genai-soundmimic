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
- `/play` — host stage, turn controls, recording playback, and real classifier predictions.
- `/join/play?code=…` — full-screen student stage connected to the host session.
- `/results` — per-round AI predictions, with optional XAI evidence controlled by the host.
- `/xai` — redirects to `/results` for backwards compatibility.

The host and student play surfaces share an authoritative game snapshot over the existing
`@genai-fi/base` PeerJS/WebRTC transport. Student recording actions include a per-connection
session token and are accepted only for the connected player whose turn is active. The host
remains the game authority whether or not they join the turn rotation.

### Play connectivity

The checked-in defaults use the same public signaling host and key as GenAI Teachable Machine.
Deployments can override them with:

```bash
VITE_APP_PEER_SERVER=
VITE_APP_PEER_SECURE=1
VITE_APP_PEER_PORT=443
VITE_APP_PEER_KEY=
VITE_APP_ICE_URLS=stun:stun.l.google.com:19302
VITE_APP_ICE_USERNAME=
VITE_APP_ICE_CREDENTIAL=
```

Provide a TURN URL and credentials through the ICE variables for school networks that block
direct WebRTC. This repository does not contain an application backend or identity provider;
permission checks are therefore enforced by the authoritative host client. A deployment that
requires durable server-side access control or audit logs must add an authenticated backend.

### Character assets

The Play stage uses rigged GLB characters through Three.js `AnimationMixer`; it intentionally
does not render capsule or static-image stand-ins. Add the ten character files documented in
[`public/assets/avatars/README.md`](./public/assets/avatars/README.md). Each model must include
compatible `Idle`, `Walk`, and `Perform` (or a supported speaking/singing alias) animation clips.
The loader caches source models, clones their skeletons per player, normalizes their height, and
crossfades between waiting, walking, and performing. Until a required model or clip is supplied,
the stage keeps the production layout and shows a compact asset notice instead of a dummy actor.

Colors are managed through reusable design tokens in `src/theme.css`. The Light/Dark selector follows the learner's system preference on first visit and remembers later changes locally.

## Localization

UI copy lives in `public/locales/<locale>/translation.json`, matching GenAI Teachable Machine's HTTP-loaded locale structure. English is the fallback and first-visit default; the 15 original languages plus Vietnamese are loaded on demand. The chosen language is stored locally and restored on the next visit.

## License

MIT, matching GenAI Teachable Machine. See [LICENSE](./LICENSE).

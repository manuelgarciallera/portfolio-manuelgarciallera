export const ChR = ({ s = 13, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 13 13" fill="none">
    <path d="M4.5 2.5l4 4-4 4" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChL = ({ s = 13, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 13 13" fill="none">
    <path d="M8.5 2.5l-4 4 4 4" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChU = ({ s = 12, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M2.4 7.6l3.6-3.6 3.6 3.6" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChD = ({ s = 12, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M2.4 4.4L6 8l3.6-3.6" stroke={c} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IcoPlay = ({ s = 22, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M8.2 6.6L17.6 12 8.2 17.4V6.6z" fill={c} stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IcoPause = ({ s = 20, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="7.2" y="6.4" width="3.8" height="11.2" rx="1.9" fill={c} />
    <rect x="13" y="6.4" width="3.8" height="11.2" rx="1.9" fill={c} />
  </svg>
);

export const IcoReplay = ({ s = 24, c = "#f5f5f7" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 4.9V2.1l4.7 3.9L12 9.9V7.1a4.9 4.9 0 104.9 4.9h2.8A7.7 7.7 0 1112 4.9z" fill={c} />
  </svg>
);

export const IcoClose = ({ s = 18, c = "#d8d8df" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M7 7l10 10M17 7L7 17" stroke={c} strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IcoLI = ({ c = "#fff" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={c}>
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" fill={c} />
  </svg>
);

export const IcoGH = ({ c = "#fff" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={c}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);


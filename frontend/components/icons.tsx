export function I({
  children,
  size = 18,
  className = '',
}: {
  children: React.ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconGrid = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </I>
);

export const IconBox3d = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
    <path d="M3.5 7 12 11.5 20.5 7" />
    <path d="M12 11.5v10" />
  </I>
);

export const IconSearch = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </I>
);

export const IconPlus = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);

export const IconUser = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </I>
);

export const IconUpload = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
    <path d="M4 16v3a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3" />
  </I>
);

export const IconClock = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </I>
);

export const IconComment = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12Z" />
  </I>
);

export const IconSettings = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
  </I>
);

export const IconLogout = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </I>
);

export const IconDownload = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M12 4v12m0 0 4-4m-4 4-4-4" />
    <path d="M4 19h16" />
  </I>
);

export const IconTrash = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
    <path d="M6.5 7 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
  </I>
);

export const IconUsers = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
    <path d="M18.5 15.7c1.5.7 2.5 2 3 4.3" />
  </I>
);

export const IconGlobe = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.1-3.5-8.5s1.2-6.2 3.5-8.5Z" />
  </I>
);

export const IconLock = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </I>
);

export const IconLink = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M10 13.5a4 4 0 0 0 5.66 0l3-3A4 4 0 0 0 13 4.84l-1.2 1.2" />
    <path d="M14 10.5a4 4 0 0 0-5.66 0l-3 3A4 4 0 0 0 11 19.16l1.2-1.2" />
  </I>
);

export const IconFolder = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2.5 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  </I>
);

export const IconChevronLeft = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </I>
);

export const IconChevronDown = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </I>
);

export const IconX = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </I>
);

export const IconChevronRight = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </I>
);

export const IconCalendar = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </I>
);

export const IconBell = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </I>
);

export const IconRefresh = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M21 21v-5h-5" />
  </I>
);

export const IconEdit = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </I>
);

export const IconPaperclip = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l7.88-7.88" />
  </I>
);

export const IconDotsVertical = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </I>
);

export const IconActivity = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </I>
);

export const IconLayers = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="m12 2 10 5-10 5L2 7l10-5Z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
  </I>
);

export const IconMessageSquare = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </I>
);

export const IconFileText = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </I>
);

export const IconDatabase = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </I>
);

export const IconBlender = (p: { size?: number; className?: string }) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2a10 10 0 0 1 10 10c0 4.42-2.87 8.17-6.84 9.5" />
    <path d="M5.5 18A9.97 9.97 0 0 1 2 12C2 6.48 6.48 2 12 2" />
    <path d="M9 12a3 3 0 0 0 6 0" />
    <line x1="12" y1="6" x2="12" y2="9" />
  </I>
);


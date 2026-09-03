const SOCIALS = {
  telegram: "https://t.me/+bvmEsa1suBcyZDU0", 
  twitter: "https://x.com/onwardlearn", 
};

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-shadow py-8 text-[14px] text-fg-dim "
      style={{ animation: "fade-up 0.8s 0.9s ease both" }}
    >
      <div className="mx-auto flex  flex-col items-center gap-4 lg:flex-row md:flex-row justify-between">
        <span>&copy; {year} Onward Team. All rights reserved.</span>

        <div className="flex items-center gap-2">
          <a
            href={SOCIALS.telegram}
            target="_blank"
            rel="noreferrer"
            aria-label="Onward on Telegram"
            className="flex h-9 w-9 items-center justify-center rounded-full text-fg-dim transition-colors duration-200 hover:bg-shadow/40 hover:text-fg"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M21.94 4.6l-3.32 15.66c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.15L18 6.36c.4-.36-.09-.56-.62-.2L6.9 13.13l-4.9-1.53c-1.06-.33-1.08-1.06.22-1.57l19.15-7.38c.89-.33 1.66.2 1.37 1.55z" />
            </svg>
          </a>

          <a
            href="{SOCIALS.twitter}"
            target="_blank"
            rel="noreferrer"
            aria-label="Onward on X"
            className="flex h-9 w-9 items-center justify-center rounded-full text-fg-dim transition-colors duration-200 hover:bg-shadow/40 hover:text-fg"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.48 3.24H4.29z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

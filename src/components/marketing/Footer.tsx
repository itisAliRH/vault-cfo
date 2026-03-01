import Link from "next/link";

const whyLinks = [
  { href: "/", label: "About" },
  { href: "/#features", label: "Features" },
  { href: "#", label: "Contact" },
];

const exploreLinks = [
  { href: "/#features", label: "Features" },
  { href: "/signup", label: "Get started" },
  { href: "#", label: "Documentation" },
];

const buildLinks = [
  { href: "/signup", label: "Get started" },
  { href: "/login", label: "Log in" },
  { href: "/", label: "Home" },
];

const legalLinks = [
  { href: "#", label: "Terms of service" },
  { href: "#", label: "Privacy policy" },
  { href: "#", label: "Legal notice" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-pixel text-xs font-medium text-foreground uppercase tracking-wider mb-4">
              Why VaultCFO
            </h3>
            <ul className="space-y-3">
              {whyLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-pixel text-xs font-medium text-foreground uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-pixel text-xs font-medium text-foreground uppercase tracking-wider mb-4">
              Build
            </h3>
            <ul className="space-y-3">
              {buildLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-pixel text-xs font-medium text-foreground uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="X (Twitter)"
            >
              <span className="text-sm font-pixel">X</span>
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="LinkedIn"
            >
              <span className="text-sm font-pixel">LinkedIn</span>
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="GitHub"
            >
              <span className="text-sm font-pixel">GitHub</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground font-pixel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-1"
              aria-haspopup="listbox"
              aria-label="Language"
            >
              en
            </button>
            <p className="text-xs text-muted-foreground">VaultCFO © 2026</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

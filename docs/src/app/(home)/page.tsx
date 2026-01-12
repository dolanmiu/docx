import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 px-6 py-16">
      <div className="max-w-3xl text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fd-border bg-fd-secondary text-sm text-fd-muted-foreground">
          <span>🍴</span>
          <span>Fork of docx.js</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          docx
        </h1>

        {/* Description */}
        <p className="text-xl text-fd-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Easily generate and modify <code className="px-1.5 py-0.5 rounded bg-fd-secondary font-mono text-lg">.docx</code> files with JS/TS.
          <br />
          Works for Node and on the Browser.
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-fd-secondary">
            <span className="text-green-500">✓</span>
            <span>Simple, declarative API</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-fd-secondary">
            <span className="text-green-500">✓</span>
            <span>80+ usage examples</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-fd-secondary">
            <span className="text-green-500">✓</span>
            <span>Battle tested, 100% coverage</span>
          </div>
        </div>

        {/* Fork focus */}
        <p className="text-fd-muted-foreground text-sm max-w-xl mx-auto">
          This fork focuses on <strong className="text-fd-foreground">modern use cases</strong>,{' '}
          <strong className="text-fd-foreground">updated dependencies</strong>, and an{' '}
          <strong className="text-fd-foreground">enhanced feature set</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
            <span>→</span>
          </Link>
          <Link
            href="https://github.com/ddloophq/docx/tree/master/demo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-fd-border bg-fd-background font-medium hover:bg-fd-secondary transition-colors"
          >
            Examples
          </Link>
          <Link
            href="https://github.com/ddloophq/docx"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-fd-border bg-fd-background font-medium hover:bg-fd-secondary transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </Link>
        </div>
      </div>
    </main>
  );
}

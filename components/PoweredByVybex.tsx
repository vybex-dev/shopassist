export default function PoweredByVybex({ className = "" }: { className?: string }) {
  return (
    <a
      className={`powered-by-vybex whitespace-nowrap ${className}`}
      href="https://vybex-dev.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
    >
      Powered by <span className="pbv-wordmark">VYBEX</span>
    </a>
  );
}

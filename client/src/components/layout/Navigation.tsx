import { Link } from "wouter";

export default function Navigation() {
  return (
    <nav className="bg-cosmic-800/90 backdrop-blur-md border-b border-cosmic-600 py-2 px-4 sticky top-0 z-40">
      <ul className="flex space-x-4 text-sm text-cosmic-silver">
        <li>
          <Link href="/" className="hover:text-cosmic-gold">Home</Link>
        </li>
        <li>
          <Link href="/collection" className="hover:text-cosmic-gold">Collection</Link>
        </li>
        <li>
          <Link href="/deck-builder" className="hover:text-cosmic-gold">Deck Builder</Link>
        </li>
        <li>
          <Link href="/profile" className="hover:text-cosmic-gold">Profile</Link>
        </li>
      </ul>
    </nav>
  );
}

"use client";
import './Navbar.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {User, Briefcase} from 'lucide-react'

interface NavbarProps {
  children: React.ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
  const pathname = usePathname();
  const isRoot = pathname === '/';

  return (
    <>
      {!isRoot && (
        <nav className="nav bg-bg-subtle">
          <Link href="/" className="nav__logo">
            {/* <div className="nav__logo-icon" /> */}
            JobScraper
          </Link>
          <div className="nav__links">
             <a href="/jobs" className="nav__page">
              <Briefcase/>
              </a>
            <a href="/profile" className="nav__page">
            <User/>
            </a>
            </div>
        </nav>
      )}
      {children}
    </>
  );
}

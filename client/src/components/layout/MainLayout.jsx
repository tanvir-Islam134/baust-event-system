import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 190;
const MAX_WIDTH = 480;

export default function MainLayout() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('baust_sidebar_open');
    if (saved !== null) return saved === 'true';
    return window.innerWidth >= 768;
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const saved = localStorage.getItem('baust_sidebar_width');
    const parsed = Number(saved);
    if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
      return parsed;
    }
    return DEFAULT_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(sidebarWidth);
  widthRef.current = sidebarWidth;

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('baust_sidebar_open', String(next));
      return next;
    });
  }, []);

  // Resizing mouse drag handlers
  const handleStartResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.min(Math.max(moveEvent.clientX, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(newWidth);
      widthRef.current = newWidth;
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('baust_sidebar_width', String(widthRef.current));
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar with dynamic width, collapse toggle, and resize handle */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={toggleSidebar}
        width={sidebarWidth}
        onStartResize={handleStartResize}
        isResizing={isResizing}
        isDesktop={isDesktop}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          isResizing ? '' : 'transition-[padding] duration-200 ease-in-out'
        }`}
        style={{
          paddingLeft: isDesktop && sidebarOpen ? `${sidebarWidth}px` : '0px',
        }}
      >
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { ASSETS } from '../data/libraryData';
import { PageRoute } from '../types';
import { SafeImage } from './SafeImage';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    route,
    navigate,
    books,
    members,
    transactions,
    settings,
    toasts,
    dismissToast,
    setSelectedMemberId,
  } = useLibrary();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const activeTransactions = useMemo(
    () => transactions.filter((t) => t.status !== 'returned'),
    [transactions]
  );

  const overdueTransactions = useMemo(
    () => activeTransactions.filter((t) => t.status === 'overdue' || t.status === 'due_today'),
    [activeTransactions]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setNotifOpen(false);
        setGuideOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        books: books.slice(0, 3),
        members: members.slice(0, 3),
        transactions: activeTransactions.slice(0, 2),
      };
    }
    return {
      books: books
        .filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.id.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q)
        )
        .slice(0, 5),
      members: members
        .filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.department.toLowerCase().includes(q)
        )
        .slice(0, 4),
      transactions: transactions
        .filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.refCode.toLowerCase().includes(q)
        )
        .slice(0, 3),
    };
  }, [searchQuery, books, members, transactions, activeTransactions]);

  const isNavActive = (itemRoute: PageRoute) => {
    if (itemRoute === 'members') {
      return route === 'members' || route === 'member-detail' || route === 'member-card';
    }
    if (itemRoute === 'circulation') {
      return route === 'circulation' || route === 'receipt';
    }
    return route === itemRoute;
  };

  const navItems: { route: PageRoute; icon: string; label: string; badge?: number }[] = [
    { route: 'dashboard', icon: 'grid_view', label: 'Dashboard & Ringkasan' },
    { route: 'catalog', icon: 'menu_book', label: 'Katalog & Inventaris Buku' },
    {
      route: 'circulation',
      icon: 'sync_alt',
      label: 'Sirkulasi & Transaksi',
      badge: activeTransactions.length,
    },
    { route: 'members', icon: 'group', label: 'Daftar Anggota' },
    { route: 'settings', icon: 'settings', label: 'Pengaturan Sistem' },
  ];

  const handleNavClick = (target: PageRoute) => {
    navigate(target);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Logo */}
          <div className="h-16 px-4 flex items-center justify-between bg-surface-container-lowest">
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
            >
              <SafeImage
                src={ASSETS.brandLogo}
                alt="Perpustakaan SMK Muhammadiyah Pakem Brand Logo"
                className="h-8 w-8 object-contain flex-shrink-0 rounded"
                fallbackIcon="local_library"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-display text-[15px] text-primary leading-none font-bold truncate">
                  Perpustakaan
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant leading-none mt-1 truncate">
                  {settings.schoolName}
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-on-surface-variant hover:text-on-surface rounded"
              aria-label="Tutup menu"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Librarian Profile Chip */}
          <div className="px-4 py-2">
            <div className="p-2 bg-surface-container-low rounded-xl flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <SafeImage
                  src={ASSETS.librarianAvatar}
                  alt={settings.librarianName}
                  className="w-8 h-8 rounded-full object-cover"
                  fallbackText="SR"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-tertiary-container rounded-full ring-2 ring-surface-container-lowest" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-semibold text-on-surface truncate">
                  {settings.librarianName}
                </span>
                <span className="text-[12px] text-on-surface-variant truncate">
                  Pustakawan Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="flex flex-col gap-1 px-4 py-2" aria-label="Menu Utama">
            {navItems.map((item) => {
              const active = isNavActive(item.route);
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleNavClick(item.route)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-[18px] flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className="text-[13.5px] whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums flex-shrink-0 ${
                        active
                          ? 'bg-surface-container-lowest/20 text-on-primary'
                          : 'bg-surface-container-highest text-primary'
                      }`}
                    >
                      {item.badge} Aktif
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Help Card */}
        <div className="p-4 bg-surface-container-low mx-4 mb-4 rounded-xl">
          <div className="flex items-center gap-2 text-on-surface font-semibold text-[13px]">
            <span className="material-symbols-outlined text-base text-primary">help_outline</span>
            <span>Pusat Panduan</span>
          </div>
          <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
            Bantuan sirkulasi buku, denda, dan kartu digital siswa.
          </p>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-surface-container-lowest text-primary text-[12px] font-semibold hover:bg-primary hover:text-on-primary transition-colors shadow-xs cursor-pointer"
          >
            Buka Panduan Singkat
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="lg:pl-64 flex flex-col min-h-screen w-full print-container">
        {/* Top Frosted Header */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
              aria-label="Buka menu navigasi"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="relative w-full text-left flex items-center pl-9 pr-14 py-2 rounded-lg bg-surface-container-lowest text-outline text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:ring-1 hover:ring-primary/30 transition-all cursor-text"
            >
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                search
              </span>
              <span className="truncate">
                Cari judul buku, pengarang, ISBN, atau nama anggota...
              </span>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                ⌘K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden xl:flex items-center gap-2 text-on-surface-variant text-[12px] whitespace-nowrap">
              <span className="material-symbols-outlined text-base text-outline">
                calendar_today
              </span>
              <span>Selasa, 24 Oktober 2023</span>
              <span className="text-outline">·</span>
              <span className="text-tertiary-container font-semibold bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
                {settings.operatingHours}
              </span>
            </div>

            <div className="h-4 w-px bg-surface-container-highest hidden xl:block" />

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative p-2 rounded-lg hover:bg-surface-container-high hover:text-on-surface text-on-surface-variant transition-colors cursor-pointer"
                aria-label="Notifikasi Sirkulasi"
              >
                <span className="material-symbols-outlined text-lg">notifications</span>
                {overdueTransactions.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                    <span className="font-display font-bold text-sm text-on-surface">
                      Peringatan Sirkulasi ({overdueTransactions.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-surface-container mt-1">
                    {overdueTransactions.length === 0 ? (
                      <p className="py-6 text-center text-xs text-on-surface-variant">
                        Tidak ada buku terlambat atau jatuh tempo hari ini.
                      </p>
                    ) : (
                      overdueTransactions.map((tx) => {
                        const m = members.find((mem) => mem.id === tx.memberId);
                        const b = books.find((bk) => bk.id === tx.bookId);
                        return (
                          <button
                            key={tx.id}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              navigate('circulation');
                            }}
                            className="w-full text-left py-2.5 px-2 hover:bg-surface-container-low rounded-lg transition-colors flex items-start gap-2.5"
                          >
                            <span
                              className={`material-symbols-outlined text-base mt-0.5 ${
                                tx.status === 'overdue' ? 'text-error' : 'text-secondary'
                              }`}
                            >
                              {tx.status === 'overdue' ? 'warning' : 'alarm'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-on-surface truncate">
                                {m?.name} · {b?.title}
                              </p>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">
                                {tx.status === 'overdue'
                                  ? `Terlambat ${tx.overdueDays} hari · Denda Rp ${(
                                      tx.overdueDays * settings.finePerDay
                                    ).toLocaleString('id-ID')}`
                                  : `Jatuh tempo hari ini (${tx.dueDate})`}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={() => navigate('circulation')}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:bg-primary-container transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Transaksi Cepat</span>
            </button>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="w-full pt-20 px-4 lg:px-6 pb-16 flex-1 bg-surface">{children}</main>
      </div>

      {/* Global Toast Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3 text-[13px]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`material-symbols-outlined text-lg flex-shrink-0 ${
                  t.type === 'success'
                    ? 'text-tertiary-fixed'
                    : t.type === 'error'
                    ? 'text-error-container'
                    : 'text-secondary-fixed'
                }`}
              >
                {t.type === 'success'
                  ? 'check_circle'
                  : t.type === 'error'
                  ? 'error'
                  : 'info'}
              </span>
              <span className="leading-snug">{t.message}</span>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="text-inverse-on-surface/70 hover:text-inverse-on-surface flex-shrink-0"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        ))}
      </div>

      {/* Command Search Modal (⌘K) */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-container">
              <span className="material-symbols-outlined text-primary text-xl">search</span>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode buku (BK-001), judul, pengarang, ID anggota (ANG-0842), atau transaksi..."
                className="w-full bg-transparent text-on-surface text-sm focus:outline-none placeholder:text-outline"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="px-2 py-0.5 rounded bg-surface-container text-xs font-mono text-on-surface-variant"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
              {searchResults.books.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-outline">
                    Koleksi Buku
                  </div>
                  <div className="space-y-1">
                    {searchResults.books.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSearchModalOpen(false);
                          navigate('catalog');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low text-left transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-xs font-semibold text-primary">
                            {b.id}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">
                              {b.title}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate">
                              {b.author} · {b.shelfLocation}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            b.availableStock > 0
                              ? 'bg-tertiary-fixed text-tertiary-container'
                              : 'bg-error-container text-error'
                          }`}
                        >
                          {b.availableStock > 0 ? `${b.availableStock} Tersedia` : 'Stok Habis'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.members.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-outline">
                    Anggota Perpustakaan
                  </div>
                  <div className="space-y-1">
                    {searchResults.members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSearchModalOpen(false);
                          setSelectedMemberId(m.id);
                          navigate('member-detail', { memberId: m.id });
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low text-left transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-primary-fixed font-mono text-xs font-semibold text-primary">
                            {m.id}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">{m.name}</p>
                            <p className="text-xs text-on-surface-variant truncate">
                              {m.role} · {m.department}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-primary font-semibold">Lihat Riwayat →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.transactions.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-outline">
                    Transaksi Sirkulasi
                  </div>
                  <div className="space-y-1">
                    {searchResults.transactions.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSearchModalOpen(false);
                          if (t.status === 'returned') {
                            navigate('receipt', { transactionId: t.id });
                          } else {
                            navigate('circulation');
                          }
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low text-left transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-primary">{t.id}</span>
                          <span className="text-xs text-on-surface-variant">
                            {t.borrowDate} → {t.dueDate}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          {t.status === 'returned' ? 'Lihat Struk' : 'Buka Sirkulasi'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Guide Modal */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setGuideOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-on-surface">
                    Panduan Operasional Pustakawan
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {settings.schoolName} · {settings.libraryUnit}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2.5 text-[13px] text-on-surface-variant leading-relaxed">
              <div className="p-3 rounded-xl bg-surface-container-low">
                <strong className="text-primary block mb-0.5">1. Validasi Sirkulasi (FR-03 s.d. FR-06)</strong>
                Maksimal pinjam <strong>{settings.maxLoansPerMember} buku/anggota</strong> dengan durasi standar{' '}
                <strong>{settings.defaultLoanDays} hari kalender</strong>. Buku stok 0 atau kartu terblokir ditolak otomatis.
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <strong className="text-primary block mb-0.5">2. Pengembalian &amp; Denda</strong>
                Gunakan panel <em>Verifikasi Pengembalian Cepat</em> untuk memulihkan stok (+1 fisik) secara instan dan mencetak struk thermal 80mm / kwitansi A5.
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <strong className="text-primary block mb-0.5">3. Kartu Digital &amp; Pemblokiran</strong>
                Buka profil siswa untuk mengakses Kartu Anggota Digital (SmartPass RFID/QR), simulasi tap gerbang, atau pemblokiran kartu hilang.
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

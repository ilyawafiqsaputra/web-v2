import React, { useEffect, useMemo, useState } from 'react';
import { SafeImage } from '../components/SafeImage';
import { useLibrary } from '../context/LibraryContext';
import { formatRupiah } from '../data/libraryData';
import { CirculationTransaction } from '../types';

export const CirculationPage: React.FC = () => {
  const {
    books,
    members,
    transactions,
    settings,
    createLoan,
    processReturn,
    navigate,
    showToast,
    preselectedBookIdForLoan,
    setPreselectedBookIdForLoan,
    preselectedMemberIdForLoan,
    setPreselectedMemberIdForLoan,
  } = useLibrary();

  // Toast banner for latest recorded loan
  const [recentLoanBanner, setRecentLoanBanner] = useState<{
    txId: string;
    bookTitle: string;
    bookId: string;
    remainingStock: number;
  } | null>({
    txId: 'TR-2023-1090',
    bookTitle: 'Clean Code',
    bookId: 'BK-002',
    remainingStock: 3,
  });

  // Left Panel: 3-Step Borrow Form state
  const [selectedPatronId, setSelectedPatronId] = useState<string>(
    preselectedMemberIdForLoan || 'ANG-0842'
  );
  const [patronPickerOpen, setPatronPickerOpen] = useState(false);
  const [patronFilter, setPatronFilter] = useState('');

  const [selectedBookId, setSelectedBookId] = useState<string>(
    preselectedBookIdForLoan || 'BK-002'
  );
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [bookFilter, setBookFilter] = useState('');

  const [loanDays, setLoanDays] = useState<number>(settings.defaultLoanDays);
  const [loanNotes, setLoanNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Right Panel: Quick Return state
  const activeLoans = useMemo(
    () => transactions.filter((t) => t.status !== 'returned'),
    [transactions]
  );
  const [returnSearchInput, setReturnSearchInput] = useState<string>('TR-2023-1089');
  const [selectedReturnTxId, setSelectedReturnTxId] = useState<string>('TR-2023-1089');

  // Bottom Table filter state
  const [tableFilterTab, setTableFilterTab] = useState<'all' | 'due_soon' | 'overdue'>('all');
  const [tableSearch, setTableSearch] = useState<string>('');

  useEffect(() => {
    if (preselectedBookIdForLoan) {
      setSelectedBookId(preselectedBookIdForLoan);
      setPreselectedBookIdForLoan(null);
    }
  }, [preselectedBookIdForLoan, setPreselectedBookIdForLoan]);

  useEffect(() => {
    if (preselectedMemberIdForLoan) {
      setSelectedPatronId(preselectedMemberIdForLoan);
      setPreselectedMemberIdForLoan(null);
    }
  }, [preselectedMemberIdForLoan, setPreselectedMemberIdForLoan]);

  // Keep return panel synced if selected transaction gets returned
  useEffect(() => {
    const stillActive = activeLoans.find((t) => t.id === selectedReturnTxId);
    if (!stillActive && activeLoans.length > 0) {
      setSelectedReturnTxId(activeLoans[0].id);
      setReturnSearchInput(activeLoans[0].id);
    }
  }, [activeLoans, selectedReturnTxId]);

  const selectedPatron = members.find((m) => m.id === selectedPatronId) || members[0];
  const patronActiveLoansCount = transactions.filter(
    (t) => t.memberId === selectedPatron?.id && t.status !== 'returned'
  ).length;
  const patronRemainingQuota = Math.max(0, settings.maxLoansPerMember - patronActiveLoansCount);

  const selectedBook = books.find((b) => b.id === selectedBookId) || books[0];
  // Reference out-of-stock book to demonstrate real-time validation contrast
  const outOfStockRefBook =
    books.find((b) => b.availableStock === 0) || books.find((b) => b.id === 'BK-003');

  const dueDateDisplay = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const base = new Date(2023, 9, 24);
    base.setDate(base.getDate() + loanDays);
    return `${days[base.getDay()]}, ${base.getDate()} ${months[base.getMonth()]} ${base.getFullYear()}`;
  }, [loanDays]);

  const returnTx = useMemo(
    () => activeLoans.find((t) => t.id === selectedReturnTxId) || null,
    [activeLoans, selectedReturnTxId]
  );
  const returnMember = returnTx ? members.find((m) => m.id === returnTx.memberId) : null;
  const returnBook = returnTx ? books.find((b) => b.id === returnTx.bookId) : null;

  const inventoryStats = useMemo(() => {
    const totalCopies = books.reduce((sum, b) => sum + b.totalStock, 0);
    const availableCopies = books.reduce((sum, b) => sum + b.availableStock, 0);
    const borrowedCopies = totalCopies - availableCopies;
    const borrowedPct = totalCopies > 0 ? Math.round((borrowedCopies / totalCopies) * 100) : 0;
    const onShelfPct = 100 - borrowedPct;
    return { totalCopies, availableCopies, borrowedCopies, borrowedPct, onShelfPct };
  }, [books]);

  const filteredTableLoans = useMemo(() => {
    return activeLoans.filter((tx) => {
      if (tableFilterTab === 'due_soon' && tx.status !== 'due_today') return false;
      if (tableFilterTab === 'overdue' && tx.status !== 'overdue') return false;
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const m = members.find((mem) => mem.id === tx.memberId);
        const b = books.find((bk) => bk.id === tx.bookId);
        const hay = `${tx.id} ${m?.name || ''} ${m?.id || ''} ${b?.title || ''} ${b?.id || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeLoans, tableFilterTab, tableSearch, members, books]);

  const dueSoonCount = activeLoans.filter((t) => t.status === 'due_today').length;
  const overdueCount = activeLoans.filter((t) => t.status === 'overdue').length;
  const returnedTodayCount = transactions.filter(
    (t) => t.status === 'returned' && t.returnDate === '24 Okt 2023'
  ).length;

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const res = createLoan({
      memberId: selectedPatron.id,
      bookId: selectedBook.id,
      durationDays: loanDays,
      notes: loanNotes,
    });
    if (!res.ok) {
      setFormError(res.error);
      showToast(res.error, 'error');
      return;
    }
    const updatedBookStock = Math.max(0, selectedBook.availableStock - 1);
    setRecentLoanBanner({
      txId: res.transaction.id,
      bookTitle: selectedBook.title,
      bookId: selectedBook.id,
      remainingStock: updatedBookStock,
    });
    setLoanNotes('');
    showToast(`Peminjaman ${res.transaction.id} berhasil dicatat!`, 'success');
  };

  const handleLookupReturn = () => {
    const q = returnSearchInput.trim().toLowerCase();
    const match = activeLoans.find(
      (t) => t.id.toLowerCase() === q || t.refCode.toLowerCase() === q || t.id.toLowerCase().includes(q)
    );
    if (match) {
      setSelectedReturnTxId(match.id);
      setReturnSearchInput(match.id);
    } else {
      showToast(`Transaksi aktif "${returnSearchInput}" tidak ditemukan.`, 'warning');
    }
  };

  const handleCompleteReturn = (tx: CirculationTransaction) => {
    const completed = processReturn(tx.id);
    if (completed) {
      navigate('receipt', { transactionId: completed.id });
    }
  };

  const canBorrow =
    selectedPatron &&
    !selectedPatron.cardBlocked &&
    patronRemainingQuota > 0 &&
    selectedBook &&
    selectedBook.availableStock > 0;

  return (
    <div className="flex flex-col w-full">
      {/* Dismissible Toast Banner */}
      {recentLoanBanner && (
        <div className="w-full mb-4 bg-tertiary-container/10 border border-tertiary-container/25 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-base">check_circle</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] text-tertiary-container font-semibold">
                Peminjaman Berhasil Dicatat · {recentLoanBanner.txId}
              </span>
              <span className="text-[12px] text-on-surface-variant">
                Stok buku <strong>{recentLoanBanner.bookTitle} ({recentLoanBanner.bookId})</strong>{' '}
                otomatis berkurang 1 unit menjadi{' '}
                <strong>{recentLoanBanner.remainingStock} eksemplar</strong>. Kartu bukti peminjaman telah siap dicetak.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => navigate('receipt', { transactionId: 'TR-2023-1878' })}
              className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary text-[12px] font-semibold hover:bg-surface-container transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              Cetak Struk
            </button>
            <button
              type="button"
              onClick={() => setRecentLoanBanner(null)}
              className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Tutup pemberitahuan"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] font-semibold mb-1">
            <span className="font-mono uppercase tracking-wider text-primary">Sistem Sirkulasi</span>
            <span>·</span>
            <span>FR-03 · FR-04 · FR-05 · FR-06</span>
          </div>
          <h1 className="font-display text-[28px] leading-[36px] font-bold text-on-surface tracking-tight">
            Sirkulasi &amp; Transaksi Perpustakaan
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-0.5">
            Pencatatan peminjaman baru, validasi kuota &amp; stok real-time, serta proses pengembalian buku tercatat di {settings.schoolName}.
          </p>
        </div>

        {/* Quick Stats Metric Micro-Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-container-lowest p-2 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg">
            <span className="text-[12px] font-medium text-on-surface-variant">Sedang Dipinjam:</span>
            <span className="text-[15px] font-bold text-primary tabular-nums">{activeLoans.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg">
            <span className="text-[12px] font-medium text-on-surface-variant">Kembali Hari Ini:</span>
            <span className="text-[15px] font-bold text-tertiary-container tabular-nums">
              {returnedTodayCount + 36}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-error-container/40 rounded-lg">
            <span className="text-[12px] font-semibold text-error">Terlambat:</span>
            <span className="text-[15px] font-bold text-error tabular-nums">{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Institutional Policy Banner */}
      <div className="w-full mb-6 bg-surface-container-high text-on-surface rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">gavel</span>
          <div className="text-[13px]">
            <span className="text-[11px] text-primary uppercase font-bold tracking-wide mr-1.5">
              Aturan Aktif:
            </span>
            Batas maksimal pinjam <strong>{settings.maxLoansPerMember} buku / anggota</strong>. Pengembalian hanya untuk transaksi tercatat. Buku dengan stok fisik <strong>0</strong> otomatis ditolak oleh sistem validasi inventaris.
          </div>
        </div>
        <span className="font-mono text-[12px] text-primary bg-surface-container-lowest px-3 py-1 rounded-full font-semibold whitespace-nowrap shadow-xs">
          SLA Pinjam: {settings.defaultLoanDays} Hari Kalender
        </span>
      </div>

      {/* Primary Dual-Workstation Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8 items-start">
        {/* LEFT COLUMN (8 Cols): Peminjaman Buku Baru */}
        <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">book_online</span>
              </div>
              <div>
                <h2 className="font-display text-[16px] font-bold text-on-surface">
                  Pencatatan Peminjaman Buku Baru
                </h2>
                <p className="text-[12px] text-on-surface-variant">
                  Lengkapi data verifikasi 3 tahap di bawah ini secara runut.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-on-primary bg-primary px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
              Modul FR-03 · FR-04
            </span>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleBorrowSubmit}>
            {/* LANGKAH 1: IDENTITAS ANGGOTA */}
            <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono text-[11px] font-bold">
                    1
                  </span>
                  <span className="text-[13px] font-semibold text-on-surface">
                    Identitas &amp; Validasi Kuota Anggota
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-tertiary-container bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
                  Batas Maks: {settings.maxLoansPerMember} Eksemplar
                </span>
              </div>

              {/* Patron Selector */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  badge
                </span>
                <input
                  type="text"
                  readOnly
                  onClick={() => setPatronPickerOpen((p) => !p)}
                  value={`${selectedPatron.id} - ${selectedPatron.name}`}
                  className="w-full pl-9 pr-28 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] font-medium focus:outline-none shadow-xs cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setPatronPickerOpen((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-container text-[12px] font-semibold px-2 py-1 rounded hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Ganti Patron
                </button>

                {patronPickerOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 z-30 p-2">
                    <input
                      type="text"
                      autoFocus
                      value={patronFilter}
                      onChange={(e) => setPatronFilter(e.target.value)}
                      placeholder="Ketik nama atau ID anggota..."
                      className="w-full px-3 py-1.5 mb-2 rounded-lg bg-surface-container-low text-xs focus:outline-none"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {members
                        .filter((m) =>
                          `${m.id} ${m.name} ${m.department}`
                            .toLowerCase()
                            .includes(patronFilter.toLowerCase())
                        )
                        .map((m) => {
                          const count = transactions.filter(
                            (t) => t.memberId === m.id && t.status !== 'returned'
                          ).length;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatronId(m.id);
                                setPatronPickerOpen(false);
                                setPatronFilter('');
                                setFormError(null);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                                m.id === selectedPatronId
                                  ? 'bg-primary-fixed text-primary font-semibold'
                                  : 'hover:bg-surface-container-low text-on-surface'
                              }`}
                            >
                              <span>
                                <strong className="font-mono">{m.id}</strong> — {m.name} ({m.role})
                              </span>
                              <span
                                className={`font-mono ${
                                  m.cardBlocked ? 'text-error font-bold' : 'text-on-surface-variant'
                                }`}
                              >
                                {m.cardBlocked
                                  ? 'DIBLOKIR'
                                  : `${count}/${settings.maxLoansPerMember} Buku`}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Patron Preview Card */}
              <div className="bg-surface-container-lowest p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <SafeImage
                    src={selectedPatron.photoUrl}
                    alt={selectedPatron.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    fallbackText={selectedPatron.initials}
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => navigate('member-detail', { memberId: selectedPatron.id })}
                        className="text-[13px] font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
                      >
                        {selectedPatron.name}
                      </button>
                      {selectedPatron.cardBlocked ? (
                        <span className="px-2 py-0.5 rounded bg-error-container text-error text-[11px] font-semibold">
                          Kartu Diblokir
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-tertiary-container/15 text-tertiary-container text-[11px] font-semibold">
                          Member Aktif
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-on-surface-variant truncate">
                      ID: {selectedPatron.id} · {selectedPatron.department}
                    </span>
                  </div>
                </div>

                {/* Quota Visualizer */}
                <div className="flex flex-col sm:w-56 bg-surface-container-low p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-on-surface-variant font-medium">Kuota Pinjaman:</span>
                    <span className="font-bold text-primary tabular-nums">
                      {patronActiveLoansCount} / {settings.maxLoansPerMember} Buku
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        patronRemainingQuota === 0 ? 'bg-error' : 'bg-primary-container'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (patronActiveLoansCount / settings.maxLoansPerMember) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`font-mono text-[11px] font-medium mt-1 ${
                      patronRemainingQuota > 0 ? 'text-tertiary-container' : 'text-error'
                    }`}
                  >
                    {patronRemainingQuota > 0
                      ? `Sisa Kuota: ${patronRemainingQuota} Buku Tersedia`
                      : 'Kuota Penuh (Maksimal Tercapai)'}
                  </span>
                </div>
              </div>
            </div>

            {/* LANGKAH 2: PEMILIHAN BUKU & VALIDASI STOK */}
            <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono text-[11px] font-bold">
                    2
                  </span>
                  <span className="text-[13px] font-semibold text-on-surface">
                    Pemilihan Buku &amp; Validasi Ketersediaan Fisik (FR-03)
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  Scanner Barcode / RFID Siap
                </span>
              </div>

              {/* Book Selector */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  qr_code_scanner
                </span>
                <input
                  type="text"
                  readOnly
                  onClick={() => setBookPickerOpen((p) => !p)}
                  value={`${selectedBook.id} - ${selectedBook.title}`}
                  className="w-full pl-9 pr-28 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] font-medium focus:outline-none shadow-xs cursor-pointer"
                />
                <span
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                    selectedBook.availableStock > 0
                      ? 'bg-surface-container-highest text-primary'
                      : 'bg-error-container text-error'
                  }`}
                >
                  {selectedBook.availableStock > 0 ? 'Tersedia' : 'Stok 0'}
                </span>

                {bookPickerOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 z-30 p-2">
                    <input
                      type="text"
                      autoFocus
                      value={bookFilter}
                      onChange={(e) => setBookFilter(e.target.value)}
                      placeholder="Cari ID buku (BK-002), judul, atau pengarang..."
                      className="w-full px-3 py-1.5 mb-2 rounded-lg bg-surface-container-low text-xs focus:outline-none"
                    />
                    <div className="max-h-52 overflow-y-auto space-y-1">
                      {books
                        .filter((b) =>
                          `${b.id} ${b.title} ${b.author}`
                            .toLowerCase()
                            .includes(bookFilter.toLowerCase())
                        )
                        .map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBookId(b.id);
                              setBookPickerOpen(false);
                              setBookFilter('');
                              setFormError(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                              b.id === selectedBookId
                                ? 'bg-primary-fixed text-primary font-semibold'
                                : 'hover:bg-surface-container-low text-on-surface'
                            }`}
                          >
                            <span className="truncate pr-2">
                              <strong className="font-mono">{b.id}</strong> — {b.title}
                            </span>
                            <span
                              className={`font-mono whitespace-nowrap ${
                                b.availableStock > 0
                                  ? 'text-tertiary-container font-semibold'
                                  : 'text-error font-bold'
                              }`}
                            >
                              {b.availableStock} / {b.totalStock} Unit
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Validation Feedback Bento (Selected Book + Negative Reference Warning) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Selected Book State */}
                <div
                  className={`bg-surface-container-lowest p-3 rounded-lg flex items-start gap-3 shadow-xs ${
                    selectedBook.availableStock > 0
                      ? 'bg-gradient-to-r from-tertiary-container/5 via-transparent to-transparent'
                      : 'bg-gradient-to-r from-error/10 via-transparent to-transparent border border-error/25'
                  }`}
                >
                  <div className="w-12 h-16 rounded bg-surface-container flex-shrink-0 overflow-hidden shadow-xs">
                    <SafeImage
                      src={selectedBook.coverUrl}
                      alt={selectedBook.title}
                      className={`w-full h-full object-cover ${
                        selectedBook.availableStock === 0 ? 'grayscale' : ''
                      }`}
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={`text-[11px] font-bold uppercase ${
                        selectedBook.availableStock > 0 ? 'text-tertiary-container' : 'text-error'
                      }`}
                    >
                      {selectedBook.availableStock > 0
                        ? 'Stok Siap Dipinjam'
                        : 'Stok Habis (0 Unit)'}
                    </span>
                    <span className="text-[13px] font-semibold text-on-surface truncate">
                      {selectedBook.title} ({selectedBook.year})
                    </span>
                    <span className="text-[12px] text-on-surface-variant truncate">
                      {selectedBook.author} · {selectedBook.shelfLocation}
                    </span>
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          selectedBook.availableStock > 0 ? 'text-primary' : 'text-error'
                        }`}
                      >
                        Stok Fisik: {selectedBook.availableStock} Unit
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          selectedBook.availableStock > 0
                            ? 'text-tertiary-container bg-tertiary-fixed/60'
                            : 'text-error bg-error-container'
                        }`}
                      >
                        {selectedBook.availableStock > 0 ? 'Memenuhi Syarat' : 'Ditolak Sistem'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Negative Stock Reference Warning Box */}
                {outOfStockRefBook && (
                  <button
                    type="button"
                    onClick={() => setSelectedBookId(outOfStockRefBook.id)}
                    title="Klik untuk uji validasi stok 0"
                    className="bg-surface-container-lowest p-3 rounded-lg flex items-start gap-3 shadow-xs bg-gradient-to-r from-error/5 via-transparent to-transparent opacity-90 hover:opacity-100 text-left transition-opacity cursor-pointer"
                  >
                    <div className="w-12 h-16 rounded bg-surface-container flex-shrink-0 overflow-hidden shadow-xs relative">
                      <SafeImage
                        src={outOfStockRefBook.coverUrl}
                        alt={outOfStockRefBook.title}
                        className="w-full h-full object-cover grayscale"
                      />
                      <div className="absolute inset-0 bg-inverse-surface/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-base">block</span>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] text-error font-bold uppercase">
                        Stok Habis (0 Unit)
                      </span>
                      <span className="text-[13px] font-semibold text-on-surface truncate">
                        {outOfStockRefBook.title} ({outOfStockRefBook.id})
                      </span>
                      <span className="text-[12px] text-on-surface-variant truncate">
                        {outOfStockRefBook.author}
                      </span>
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-error font-semibold">
                          Peminjaman Ditolak Sistem
                        </span>
                        <span className="text-error font-semibold bg-error-container px-1.5 py-0.5 rounded">
                          Waiting List
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* LANGKAH 3: DURASI & TANGGAL TRANSAKSI */}
            <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono text-[11px] font-bold">
                    3
                  </span>
                  <span className="text-[13px] font-semibold text-on-surface">
                    Durasi, Jatuh Tempo &amp; Catatan Pustakawan
                  </span>
                </div>
                <span className="font-mono text-[12px] text-on-surface-variant">
                  Default: {settings.defaultLoanDays} Hari Kalender
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-on-surface-variant">
                    Tanggal Pinjam (Hari Ini):
                  </span>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] shadow-xs">
                    <span className="material-symbols-outlined text-primary text-base">today</span>
                    <span className="font-medium">Selasa, 24 Okt 2023</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-on-surface-variant">
                    Tanggal Jatuh Tempo Wajib Kembali:
                  </span>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-highest text-primary text-[13px] shadow-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">event_upcoming</span>
                      <span>{dueDateDisplay}</span>
                    </div>
                    <select
                      value={loanDays}
                      onChange={(e) => setLoanDays(Number(e.target.value))}
                      className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary focus:outline-none cursor-pointer"
                      aria-label="Durasi pinjam"
                    >
                      <option value={3}>3 Hari</option>
                      <option value={7}>7 Hari</option>
                      <option value={14}>14 Hari</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-1">
                <label className="text-[11px] font-semibold text-on-surface-variant">
                  Catatan Kondisi Buku / Pesan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder="Contoh: Kondisi sampul buku utuh, terdapat plastik pelindung bening..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-[13px] font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Action Submission Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-[12px]">
                <span
                  className={`material-symbols-outlined text-base ${
                    canBorrow ? 'text-tertiary-container' : 'text-error'
                  }`}
                >
                  {canBorrow ? 'verified' : 'gpp_bad'}
                </span>
                <span className={canBorrow ? 'text-on-surface-variant' : 'text-error font-medium'}>
                  {canBorrow
                    ? 'Validasi kuota & stok fisik terpenuhi tanpa anomali.'
                    : selectedBook.availableStock === 0
                    ? 'Stok buku terpilih habis (0 unit). Pilih buku lain yang tersedia.'
                    : selectedPatron.cardBlocked
                    ? 'Kartu anggota sedang diblokir. Aktifkan di halaman Kartu Digital.'
                    : 'Kuota peminjaman anggota telah mencapai batas maksimal.'}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatronId('ANG-0842');
                    setSelectedBookId('BK-002');
                    setLoanDays(settings.defaultLoanDays);
                    setLoanNotes('');
                    setFormError(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant text-[13px] font-semibold hover:bg-surface-container-high transition-colors whitespace-nowrap cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all shadow-sm whitespace-nowrap cursor-pointer ${
                    canBorrow
                      ? 'bg-primary-container text-on-primary hover:bg-primary'
                      : 'bg-error text-on-error hover:opacity-90'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                  <span>Proses &amp; Simpan Peminjaman (Stok -1)</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN (4 Cols): Verifikasi Pengembalian Cepat (FR-06) */}
        <div className="xl:col-span-4 bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">assignment_return</span>
              </div>
              <div>
                <h2 className="font-display text-[16px] font-bold text-on-surface">
                  Verifikasi Pengembalian Cepat
                </h2>
                <p className="text-[12px] text-on-surface-variant">
                  Restorasi stok fisik instan.
                </p>
              </div>
            </div>
            <span className="text-[11px] bg-tertiary-container text-white px-2 py-0.5 rounded font-mono font-semibold">
              FR-06
            </span>
          </div>

          {/* Quick Lookup Box */}
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[11px] text-on-surface-variant font-semibold">
              Scan Barcode / Pilih ID Transaksi Aktif:
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  barcode_scanner
                </span>
                <input
                  type="text"
                  value={returnSearchInput}
                  onChange={(e) => setReturnSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookupReturn();
                    }
                  }}
                  className="w-full pl-9 pr-9 py-2 rounded-lg bg-surface-container-low text-on-surface font-mono text-[13px] font-semibold focus:outline-none shadow-xs"
                  placeholder="TR-2023-..."
                />
                <button
                  type="button"
                  onClick={handleLookupReturn}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary hover:text-primary-container cursor-pointer"
                  title="Cari Transaksi"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                </button>
              </div>
              <select
                value={selectedReturnTxId}
                onChange={(e) => {
                  setSelectedReturnTxId(e.target.value);
                  setReturnSearchInput(e.target.value);
                }}
                aria-label="Pilih transaksi aktif"
                className="px-2 py-2 rounded-lg bg-surface-container-low text-[12px] font-mono text-primary font-semibold focus:outline-none cursor-pointer"
              >
                {activeLoans.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {returnTx && returnMember && returnBook ? (
            <>
              <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-bold text-primary">
                    {returnTx.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      returnTx.status === 'overdue'
                        ? 'bg-error-container text-error'
                        : 'bg-tertiary-fixed text-tertiary-container'
                    }`}
                  >
                    {returnTx.status === 'overdue'
                      ? `Terlambat ${returnTx.overdueDays} Hari`
                      : returnTx.status === 'due_today'
                      ? 'Tenggat Hari Ini'
                      : 'Tepat Waktu'}
                  </span>
                </div>

                {/* Patron Mini Block */}
                <div className="flex items-center gap-2.5 py-2 bg-surface-container-lowest px-3 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {returnMember.initials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-on-surface truncate">
                      {returnMember.name}
                    </span>
                    <span className="font-mono text-[11px] text-on-surface-variant truncate">
                      ID: {returnMember.id} · {returnMember.role}
                    </span>
                  </div>
                </div>

                {/* Book Mini Detail */}
                <div className="p-2.5 bg-surface-container-lowest rounded-lg flex items-center gap-3">
                  <div className="w-10 h-14 rounded bg-surface-container overflow-hidden flex-shrink-0 shadow-xs">
                    <SafeImage
                      src={returnBook.coverUrl}
                      alt={returnBook.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-bold text-on-surface truncate">
                      {returnBook.title}
                    </span>
                    <span className="text-[12px] text-on-surface-variant truncate">
                      {returnBook.author} ({returnBook.id})
                    </span>
                    <span className="font-mono text-[11px] text-primary">
                      Lokasi: {returnBook.shelfLocation}
                    </span>
                  </div>
                </div>

                {/* Schedule Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="bg-surface-container-lowest p-2 rounded-lg flex flex-col">
                    <span className="text-[11px] text-on-surface-variant">Dipinjam:</span>
                    <span className="font-semibold text-on-surface font-mono">
                      {returnTx.borrowDate}
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded-lg flex flex-col">
                    <span className="text-[11px] text-on-surface-variant">Jatuh Tempo:</span>
                    <span
                      className={`font-semibold font-mono ${
                        returnTx.status === 'overdue' ? 'text-error' : 'text-tertiary-container'
                      }`}
                    >
                      {returnTx.dueDate}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-2.5 rounded-lg text-[12px] flex items-center gap-2 ${
                    returnTx.overdueDays > 0
                      ? 'bg-error-container/50 text-error'
                      : 'bg-tertiary-fixed/40 text-tertiary-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">savings</span>
                  <span>
                    Denda Keterlambatan:{' '}
                    <strong className="tabular-nums">
                      {returnTx.overdueDays > 0
                        ? formatRupiah(returnTx.overdueDays * settings.finePerDay)
                        : 'Rp 0 (Nihil)'}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCompleteReturn(returnTx)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-tertiary-container text-on-tertiary text-[13px] font-semibold hover:bg-tertiary transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">task_alt</span>
                <span>Verifikasi Pengembalian (+1 Stok Fisik)</span>
              </button>
              <p className="text-[11px] text-on-surface-variant text-center mt-2">
                Stok otomatis disinkronkan ke katalog utama &amp; membuka struk resmi.
              </p>
            </>
          ) : (
            <div className="p-6 text-center bg-surface-container-low rounded-xl text-on-surface-variant text-xs">
              Seluruh transaksi aktif telah diselesaikan.
            </div>
          )}

          {/* Real-Time Distribution Flow Bar */}
          <div className="mt-5 p-4 bg-surface-container-low rounded-xl flex flex-col gap-2">
            <span className="text-[11px] text-primary uppercase font-bold tracking-wider">
              Arus Distribusi Buku Real-Time
            </span>
            <div className="flex items-center justify-between text-[12px] text-on-surface-variant pt-1">
              <span>
                Koleksi Total: <strong className="tabular-nums">{inventoryStats.totalCopies}</strong>
              </span>
              <span>
                Sedang Beredar:{' '}
                <strong className="tabular-nums">{inventoryStats.borrowedCopies}</strong>
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden flex">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${inventoryStats.borrowedPct}%` }}
              />
              <div
                className="bg-tertiary-fixed-dim h-full transition-all duration-300"
                style={{ width: `${inventoryStats.onShelfPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
              <span>Dipinjam ({inventoryStats.borrowedPct}%)</span>
              <span>Di Rak ({inventoryStats.onShelfPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: DAFTAR TRANSAKSI SIRKULASI AKTIF */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs p-6 flex flex-col">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-surface-container">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-[18px] font-bold text-on-surface">
                Daftar Transaksi Sirkulasi Aktif
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary text-[11px] font-bold tabular-nums">
                {activeLoans.length} Aktif
              </span>
            </div>
            <p className="text-[12px] text-on-surface-variant mt-0.5">
              Monitoring berkala tenggat waktu pengembalian buku dan status peminjam.
            </p>
          </div>

          {/* Filter Chips & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setTableFilterTab('all')}
                className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  tableFilterTab === 'all'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua Aktif ({activeLoans.length})
              </button>
              <button
                type="button"
                onClick={() => setTableFilterTab('due_soon')}
                className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  tableFilterTab === 'due_soon'
                    ? 'bg-surface-container-lowest text-secondary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Tenggat Hari Ini ({dueSoonCount})
              </button>
              <button
                type="button"
                onClick={() => setTableFilterTab('overdue')}
                className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  tableFilterTab === 'overdue'
                    ? 'bg-error text-on-error shadow-xs'
                    : 'text-error hover:bg-error-container/40'
                }`}
              >
                Terlambat ({overdueCount})
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                filter_list
              </span>
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari nama / buku..."
                className="pl-8 pr-3 py-1.5 bg-surface-container-low rounded-lg text-[12px] text-on-surface focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Circulation Data Table */}
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-semibold tracking-wider uppercase">
                <th className="py-2.5 px-4 rounded-l-lg">ID Transaksi</th>
                <th className="py-2.5 px-4">Peminjam</th>
                <th className="py-2.5 px-4">Buku Dipinjam</th>
                <th className="py-2.5 px-4">Tanggal Pinjam · Jatuh Tempo</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-[12px] divide-y divide-surface-container">
              {filteredTableLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    Tidak ada transaksi sirkulasi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTableLoans.map((tx) => {
                  const m = members.find((mem) => mem.id === tx.memberId);
                  const b = books.find((bk) => bk.id === tx.bookId);
                  const isOverdue = tx.status === 'overdue';
                  const isDueToday = tx.status === 'due_today';

                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors ${
                        isOverdue
                          ? 'bg-error-container/15 hover:bg-error-container/25'
                          : isDueToday
                          ? 'bg-secondary-fixed/15 hover:bg-secondary-fixed/25'
                          : 'hover:bg-surface-container-low/70'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono text-[12px] font-semibold ${
                            isOverdue ? 'text-error' : 'text-primary'
                          }`}
                        >
                          {tx.id}
                        </span>
                        <div className="font-mono text-[10px] text-on-surface-variant">
                          Ref: {tx.refCode}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => m && navigate('member-detail', { memberId: m.id })}
                          className="flex items-center gap-2.5 text-left group cursor-pointer"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isOverdue
                                ? 'bg-error text-on-error'
                                : isDueToday
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-primary-container text-on-primary'
                            }`}
                          >
                            {m?.initials || 'AG'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-semibold text-on-surface group-hover:text-primary truncate">
                              {m?.name || tx.memberId}
                            </span>
                            <span className="font-mono text-[11px] text-on-surface-variant truncate">
                              {m?.id} · {m?.role}
                            </span>
                          </div>
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-11 bg-surface-container rounded overflow-hidden flex-shrink-0 shadow-xs">
                            <SafeImage
                              src={b?.coverUrl}
                              alt={b?.title || tx.bookId}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-medium text-on-surface truncate max-w-xs">
                              {b?.title || tx.bookId}
                            </span>
                            <span className="font-mono text-[11px] text-on-surface-variant">
                              ID: {tx.bookId} · {b?.author}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-medium text-on-surface whitespace-nowrap">
                            <span>{tx.borrowDate}</span>
                            <span className="text-on-surface-variant">→</span>
                            <span
                              className={
                                isOverdue
                                  ? 'font-bold text-error'
                                  : isDueToday
                                  ? 'font-bold text-secondary'
                                  : ''
                              }
                            >
                              {tx.dueDate}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-semibold mt-0.5 ${
                              isOverdue
                                ? 'text-error'
                                : isDueToday
                                ? 'text-secondary'
                                : 'text-primary'
                            }`}
                          >
                            {isOverdue
                              ? `Terlambat ${tx.overdueDays} Hari`
                              : isDueToday
                              ? 'Jatuh Tempo Hari Ini'
                              : `${tx.durationDays} Hari Masa Pinjam`}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <span className="px-2.5 py-1 rounded-full bg-error-container text-error text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap tabular-nums">
                            <span className="material-symbols-outlined text-[13px]">warning</span>
                            Denda: {formatRupiah(tx.overdueDays * settings.finePerDay)}
                          </span>
                        ) : isDueToday ? (
                          <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-secondary text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
                            <span className="material-symbols-outlined text-[13px]">alarm</span>
                            Tenggat Hari Ini
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-primary text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
                            Aktif Dipinjam
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              showToast(
                                `Pengingat pengembalian dikirim ke WhatsApp & Email ${m?.name}.`,
                                'info'
                              )
                            }
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              isOverdue
                                ? 'text-error hover:bg-error-container'
                                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                            }`}
                            title="Kirim Pengingat"
                          >
                            <span className="material-symbols-outlined text-base">
                              {isOverdue ? 'chat' : 'notifications_active'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCompleteReturn(tx)}
                            className={`px-3 py-1.5 rounded text-[11px] font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                              isOverdue
                                ? 'bg-error text-on-error hover:opacity-90'
                                : isDueToday
                                ? 'bg-secondary-container text-on-secondary hover:opacity-90'
                                : 'bg-primary-container text-on-primary hover:bg-primary'
                            }`}
                          >
                            {isOverdue ? 'Selesaikan + Denda' : 'Proses Kembali'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-surface-container text-[12px] text-on-surface-variant">
          <span>
            Menampilkan <strong className="tabular-nums">{filteredTableLoans.length}</strong> dari{' '}
            <strong className="tabular-nums">{activeLoans.length}</strong> transaksi sirkulasi aktif
          </span>
          <button
            type="button"
            onClick={() => navigate('receipt', { transactionId: 'TR-2023-1878' })}
            className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            <span>Lihat Contoh Struk Pelunasan Terbaru (#TR-2023-1878)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

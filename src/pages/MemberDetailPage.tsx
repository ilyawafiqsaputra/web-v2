import React, { useMemo, useState } from 'react';
import { SafeImage } from '../components/SafeImage';
import { useLibrary } from '../context/LibraryContext';
import { formatRupiah } from '../data/libraryData';

export const MemberDetailPage: React.FC = () => {
  const {
    selectedMemberId,
    members,
    books,
    transactions,
    settings,
    navigate,
    extendLoan,
    processReturn,
    updateMember,
    showToast,
  } = useLibrary();

  const member = members.find((m) => m.id === selectedMemberId) || members[0];

  const [historyTab, setHistoryTab] = useState<'all' | 'active' | 'returned' | 'fines'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [academicYear, setAcademicYear] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [editName, setEditName] = useState(member.name);
  const [editPhone, setEditPhone] = useState(member.phone);
  const [editEmail, setEditEmail] = useState(member.email);
  const [editDepartment, setEditDepartment] = useState(member.department);

  const memberTransactions = useMemo(
    () => transactions.filter((t) => t.memberId === member.id),
    [transactions, member.id]
  );

  const activeLoans = useMemo(
    () => memberTransactions.filter((t) => t.status !== 'returned'),
    [memberTransactions]
  );
  const returnedOnTimeCount = useMemo(
    () => memberTransactions.filter((t) => t.status === 'returned' && t.overdueDays === 0).length,
    [memberTransactions]
  );
  const fineHistoryCount = useMemo(
    () => memberTransactions.filter((t) => t.fineAmount > 0 || t.overdueDays > 0).length,
    [memberTransactions]
  );

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return memberTransactions.filter((tx) => {
      if (historyTab === 'active' && tx.status === 'returned') return false;
      if (historyTab === 'returned' && tx.status !== 'returned') return false;
      if (historyTab === 'fines' && tx.fineAmount === 0 && tx.overdueDays === 0) return false;
      if (academicYear === '2023-2024' && !tx.borrowDateISO.startsWith('2023-0')) {
        // simple academic year check: Jul-Dec 2023 vs earlier
        if (tx.borrowDateISO < '2023-07-01') return false;
      }
      if (academicYear === '2022-2023' && tx.borrowDateISO >= '2023-07-01') return false;
      if (q) {
        const b = books.find((bk) => bk.id === tx.bookId);
        const hay = `${tx.id} ${b?.title || ''} ${b?.author || ''} ${b?.isbn || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [memberTransactions, historyTab, historySearch, academicYear, books]);

  const remainingQuota = Math.max(0, settings.maxLoansPerMember - activeLoans.length);
  const primaryActiveLoan = activeLoans[0];
  const primaryActiveBook = primaryActiveLoan
    ? books.find((b) => b.id === primaryActiveLoan.bookId)
    : null;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMember(member.id, {
      name: editName.trim() || member.name,
      phone: editPhone.trim(),
      email: editEmail.trim(),
      department: editDepartment.trim(),
    });
    setEditModalOpen(false);
  };

  const handleExportHistory = () => {
    const headers = ['ID Transaksi', 'Buku', 'Tgl Pinjam', 'Tgl Kembali/Tenggat', 'Denda', 'Status'];
    const rows = filteredHistory.map((t) => {
      const b = books.find((bk) => bk.id === t.bookId);
      return [
        t.id,
        `"${b?.title || t.bookId}"`,
        t.borrowDate,
        t.returnDate || t.dueDate,
        t.fineAmount,
        t.status,
      ];
    });
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat_sirkulasi_${member.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Riwayat peminjaman ${member.name} diekspor ke CSV.`, 'success');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5 text-on-surface-variant text-[12px]">
            <button
              type="button"
              onClick={() => navigate('members')}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Daftar Anggota</span>
            </button>
            <span className="text-outline">/</span>
            <span>Profil &amp; Riwayat Peminjaman</span>
            <span className="text-outline">/</span>
            <span className="text-[13px] text-primary font-semibold">
              {member.name} ({member.id})
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="font-display text-[28px] leading-[36px] text-on-surface font-bold tracking-tight">
              Detail Sirkulasi Anggota
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-[11px] font-semibold shadow-xs ${
                member.cardBlocked
                  ? 'bg-error-container text-error'
                  : 'bg-tertiary-fixed text-tertiary-container'
              }`}
            >
              {member.cardBlocked ? 'Kartu Diblokir' : 'Member Aktif'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('member-card', { memberId: member.id })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-xs text-[13px] font-semibold whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">badge</span>
            <span>Kartu Anggota Digital</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditName(member.name);
              setEditPhone(member.phone);
              setEditEmail(member.email);
              setEditDepartment(member.department);
              setEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-xs text-[13px] font-semibold whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            <span>Ubah Data</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('circulation', { loanMemberId: member.id })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm text-[13px] font-semibold whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">bookmark_add</span>
            <span>Catat Peminjaman Baru</span>
          </button>
        </div>
      </div>

      {/* Member Profile & Quota Bento Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-2">
        {/* Left 8 Cols: Identity & Core Details */}
        <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
            <div className="relative">
              <SafeImage
                src={member.photoUrl}
                alt={member.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shadow-sm ring-4 ring-surface-container"
                fallbackText={member.initials}
              />
              <span className="absolute -bottom-1 -right-1 bg-tertiary-container text-on-tertiary px-2 py-0.5 rounded font-mono text-[11px] font-bold shadow-xs">
                {member.className}
              </span>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-display text-[22px] text-on-surface font-bold truncate">
                  {member.name}
                </h2>
                <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[12px] text-primary font-semibold">
                  {member.id}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] text-on-surface-variant font-medium">
                  NIS/NISN: {member.nisNisn}
                </span>
              </div>

              <p className="text-[14px] text-on-surface-variant flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-base text-primary">school</span>
                <span>
                  {member.role} · {settings.schoolName} ({member.department})
                </span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 pt-1 text-on-surface-variant text-[12px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-base text-outline">mail</span>
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-outline">call</span>
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-outline">
                    calendar_month
                  </span>
                  <span>Sejak {member.joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Compliance Bar */}
          <div className="mt-6 pt-4 flex flex-wrap items-center justify-between gap-4 bg-surface-container-low p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary-container shadow-xs">
                <span className="material-symbols-outlined text-lg">verified_user</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-on-surface font-semibold">
                  Bebas Tunggakan Denda
                </span>
                <span className="text-[12px] text-on-surface-variant">
                  Tidak ada sanksi administratif aktif
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wide font-semibold">
                  Tingkat Pengembalian Tepat
                </span>
                <span className="font-display text-[18px] font-bold text-tertiary-container tabular-nums">
                  {member.complianceRate}%{' '}
                  <span className="text-[12px] font-normal text-on-surface-variant">
                    (Sangat Baik)
                  </span>
                </span>
              </div>
              <div className="w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-highest"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-tertiary-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${member.complianceRate}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Circulation Quota Gauge Card */}
        <div className="xl:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
                Aturan Kuota (FR-05)
              </span>
              <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary font-mono text-[11px] font-bold">
                Maks. {settings.maxLoansPerMember} Buku
              </span>
            </div>
            <h3 className="text-[16px] text-on-surface font-bold">Status Kuota Peminjaman</h3>
            <p className="text-[12px] text-on-surface-variant mt-1">
              Kapasitas peminjaman aktif yang diizinkan untuk anggota {settings.schoolName}.
            </p>
          </div>

          <div className="my-5">
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1 tabular-nums">
                <span className="font-display text-[36px] text-primary font-bold">
                  {activeLoans.length}
                </span>
                <span className="text-[18px] text-outline">/ {settings.maxLoansPerMember}</span>
                <span className="text-[12px] text-on-surface-variant ml-1 font-medium">
                  Buku Terpakai
                </span>
              </div>
              <span className="text-[12px] text-tertiary-container font-semibold bg-tertiary-fixed/50 px-2 py-0.5 rounded">
                Sisa {remainingQuota} Kuota
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: settings.maxLoansPerMember }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-3 rounded-full ${
                    idx < activeLoans.length ? 'bg-primary shadow-xs' : 'bg-surface-container-high'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between font-mono text-[11px] text-outline mt-1.5">
              {Array.from({ length: settings.maxLoansPerMember }).map((_, idx) => (
                <span key={idx}>
                  Slot {idx + 1} ({idx < activeLoans.length ? 'Terisi' : 'Tersedia'})
                </span>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between">
            <span className="text-[12px] text-on-surface font-medium">Batas Waktu Pinjam</span>
            <span className="text-[13px] text-on-surface font-semibold">
              {settings.defaultLoanDays} Hari Kalender
            </span>
          </div>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">history_edu</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Peminjaman
            </span>
            <span className="font-display text-[18px] text-on-surface font-bold tabular-nums">
              {memberTransactions.length} Transaksi
            </span>
            <span className="text-[12px] text-outline truncate">Sepanjang masa terdaftar</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_stories</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-primary uppercase tracking-wider font-semibold">
              Sedang Dipinjam
            </span>
            <span className="font-display text-[18px] text-primary font-bold tabular-nums">
              {activeLoans.length} Buku Aktif
            </span>
            <span className="text-[12px] text-on-surface-variant truncate">
              {primaryActiveLoan ? `Tenggat: ${primaryActiveLoan.dueDate}` : 'Tidak ada pinjaman'}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary-container flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Selesai Tepat Waktu
            </span>
            <span className="font-display text-[18px] text-tertiary-container font-bold tabular-nums">
              {returnedOnTimeCount} Buku
            </span>
            <span className="text-[12px] text-on-surface-variant">
              Rasio {member.complianceRate}% tertib
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Riwayat Terlambat
            </span>
            <span className="font-display text-[18px] text-secondary font-bold tabular-nums">
              {fineHistoryCount} Kali Denda
            </span>
            <span className="text-[12px] text-on-surface-variant">Semua telah lunas</span>
          </div>
        </div>
      </div>

      {/* Active Loan Callout Card */}
      {primaryActiveLoan && primaryActiveBook && (
        <div className="mt-6 bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden">
          <div className="bg-primary px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-on-primary">
              <span className="material-symbols-outlined text-xl text-tertiary-fixed">
                lock_clock
              </span>
              <span className="text-[15px] font-semibold">
                Buku yang Sedang Dipinjam (Sirkulasi Berjalan)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-mono text-[11px] font-semibold">
              {primaryActiveLoan.id}
            </span>
          </div>

          <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
              <div className="relative w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                <SafeImage
                  src={primaryActiveBook.coverUrl}
                  alt={primaryActiveBook.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 bg-surface-container-lowest/90 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-on-surface">
                  {primaryActiveBook.id}
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary text-[11px] font-semibold">
                    Aktif Dipinjam
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant font-medium">
                    DDC {primaryActiveBook.ddcCode}
                  </span>
                </div>
                <h3 className="font-display text-[17px] text-on-surface font-bold truncate">
                  {primaryActiveBook.title}
                </h3>
                <p className="text-[13px] text-on-surface-variant">
                  Penulis: {primaryActiveBook.author} · Penerbit: {primaryActiveBook.publisher} (
                  {primaryActiveBook.year})
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[12px] text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-outline">
                      event_available
                    </span>
                    <span>
                      Pinjam:{' '}
                      <strong className="text-on-surface font-semibold">
                        {primaryActiveLoan.borrowDate}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-error">
                      event_busy
                    </span>
                    <span>
                      Tenggat:{' '}
                      <strong className="text-error font-semibold">
                        {primaryActiveLoan.dueDate}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">
                      shelves
                    </span>
                    <span>
                      Lokasi:{' '}
                      <span className="bg-surface-container px-1.5 py-0.5 rounded text-on-surface font-medium">
                        {primaryActiveBook.shelfLocation}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => extendLoan(primaryActiveLoan.id, 7)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container text-primary text-[13px] font-semibold hover:bg-surface-container-high transition-colors whitespace-nowrap cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">update</span>
                <span>Perpanjang (7 Hari)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const done = processReturn(primaryActiveLoan.id);
                  if (done) navigate('receipt', { transactionId: done.id });
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-tertiary-container text-on-tertiary text-[13px] font-semibold hover:opacity-95 shadow-xs transition-opacity whitespace-nowrap cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                <span>Proses Pengembalian</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Circulation Section */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-[18px] text-on-surface font-bold">
              Catatan Riwayat Sirkulasi Peminjaman
            </h2>
            <p className="text-[12px] text-on-surface-variant">
              Log transaksi peminjaman, pengembalian, dan penalti sejak awal keanggotaan.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setHistoryTab('all')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                historyTab === 'all'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semua Riwayat ({memberTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('active')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                historyTab === 'active'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Sedang Dipinjam</span>
              <span className="px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                {activeLoans.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('returned')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                historyTab === 'returned'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sudah Kembali ({memberTransactions.length - activeLoans.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('fines')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                historyTab === 'fines'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Riwayat Denda</span>
              <span className="px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold">
                {fineHistoryCount}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Academic Year Filter */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Cari judul buku, ISBN, atau ID transaksi..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-low text-on-surface text-[13px] placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-2 rounded-lg text-on-surface text-[12px]">
              <span className="material-symbols-outlined text-base text-outline">
                calendar_today
              </span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-transparent text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Semester</option>
                <option value="2023-2024">Tahun Akademik 2023/2024</option>
                <option value="2022-2023">Tahun Akademik 2022/2023</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExportHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-[12px] font-semibold transition-colors cursor-pointer"
              title="Export CSV / Excel"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">ID Transaksi</th>
                  <th className="py-3 px-4">Buku &amp; Pengarang</th>
                  <th className="py-3 px-4">Tgl Pinjam</th>
                  <th className="py-3 px-4">Tgl Kembali</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Pustakawan</th>
                  <th className="py-3 px-4">Status Peminjaman</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low text-[12px]">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                      Tidak ada catatan riwayat yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((tx) => {
                    const b = books.find((bk) => bk.id === tx.bookId);
                    const isActive = tx.status !== 'returned';
                    const isLate = tx.overdueDays > 0;
                    return (
                      <tr
                        key={tx.id}
                        className={`transition-colors ${
                          isActive
                            ? 'bg-surface-container-low/40 hover:bg-primary-fixed/20'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-primary whitespace-nowrap">
                          {tx.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-[240px]">
                            <SafeImage
                              src={b?.coverUrl}
                              alt={b?.title || tx.bookId}
                              className="w-9 h-12 object-cover rounded shadow-xs flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] text-on-surface font-semibold truncate">
                                {b?.title || tx.bookId}
                              </span>
                              <span className="text-on-surface-variant truncate">{b?.author}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-on-surface font-medium whitespace-nowrap">
                          {tx.borrowDate}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isActive ? (
                            <>
                              <span className="text-error font-semibold">{tx.dueDate}</span>
                              <span className="block text-[11px] text-outline">Estimasi Tenggat</span>
                            </>
                          ) : (
                            <>
                              <span className={isLate ? 'text-secondary font-semibold' : ''}>
                                {tx.returnDate}
                              </span>
                              {isLate && (
                                <span className="block text-[11px] text-outline">
                                  Jatuh tempo: {tx.dueDate}
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                          {isActive
                            ? `${tx.durationDays} Hari (Berjalan)`
                            : isLate
                            ? `${tx.durationDays} Hari (+${tx.overdueDays} Hari)`
                            : `${tx.durationDays} Hari`}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">
                          {tx.librarianName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isActive ? (
                            <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-primary text-[11px] font-semibold">
                              Aktif Dipinjam
                            </span>
                          ) : isLate ? (
                            <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-secondary text-[11px] font-semibold">
                              Terlambat {tx.overdueDays} Hari (Denda {formatRupiah(tx.fineAmount)}{' '}
                              Lunas)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-tertiary-container text-[11px] font-semibold">
                              Kembali Tepat Waktu
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigate('receipt', { transactionId: tx.id })}
                            title="Lihat Bukti / Kwitansi"
                            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">
                              {isLate ? 'receipt_long' : 'receipt'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 bg-surface-container-low flex items-center justify-between text-[12px] text-on-surface-variant">
            <span>
              Menampilkan <strong className="text-on-surface">{filteredHistory.length}</strong> dari{' '}
              <strong className="text-on-surface">{memberTransactions.length}</strong> total riwayat
              peminjaman
            </span>
          </div>
        </div>
      </div>

      {/* Edit Member Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl max-w-md w-full p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-on-surface">
                Ubah Data Anggota ({member.id})
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Kompetensi / Unit</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

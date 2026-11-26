import React, { useMemo } from 'react';
import { SafeImage } from '../components/SafeImage';
import { useLibrary } from '../context/LibraryContext';
import { formatRupiah } from '../data/libraryData';

const WEEKLY_ACTIVITY = [
  { day: 'Kam', date: '19 Okt', loans: 14, returns: 11 },
  { day: 'Jum', date: '20 Okt', loans: 18, returns: 15 },
  { day: 'Sab', date: '21 Okt', loans: 9, returns: 12 },
  { day: 'Min', date: '22 Okt', loans: 0, returns: 0 },
  { day: 'Sen', date: '23 Okt', loans: 22, returns: 17 },
  { day: 'Sel', date: '24 Okt', loans: 16, returns: 14 },
];

export const DashboardPage: React.FC = () => {
  const {
    books,
    members,
    transactions,
    settings,
    navigate,
    processReturn,
    extendLoan,
  } = useLibrary();

  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, b) => sum + b.totalStock, 0);
    const availableCopies = books.reduce((sum, b) => sum + b.availableStock, 0);
    const borrowedCopies = Math.max(0, totalCopies - availableCopies);
    const outOfStockBooks = books.filter((b) => b.availableStock === 0);

    const activeLoans = transactions.filter((t) => t.status !== 'returned');
    const overdueLoans = activeLoans.filter((t) => t.status === 'overdue');
    const dueTodayLoans = activeLoans.filter((t) => t.status === 'due_today');
    const returnedLoans = transactions.filter((t) => t.status === 'returned');
    const onTimeReturned = returnedLoans.filter((t) => t.overdueDays === 0).length;

    const avgCompliance =
      members.length > 0
        ? Math.round(members.reduce((sum, m) => sum + m.complianceRate, 0) / members.length)
        : 100;

    const activeFines = overdueLoans.reduce(
      (sum, t) => sum + t.overdueDays * settings.finePerDay,
      0
    );
    const collectedFines = returnedLoans
      .filter((t) => t.finePaid)
      .reduce((sum, t) => sum + t.fineAmount, 0);

    const blockedCards = members.filter((m) => m.cardBlocked).length;

    const availPct = totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0;
    const borrowedPct = totalCopies > 0 ? Math.round((borrowedCopies / totalCopies) * 100) : 0;

    return {
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies,
      outOfStockBooks,
      activeLoans,
      overdueLoans,
      dueTodayLoans,
      returnedLoans,
      onTimeReturned,
      avgCompliance,
      activeFines,
      collectedFines,
      blockedCards,
      availPct,
      borrowedPct,
    };
  }, [books, members, transactions, settings.finePerDay]);

  const attentionTransactions = useMemo(
    () =>
      transactions.filter(
        (t) => t.status === 'overdue' || t.status === 'due_today'
      ),
    [transactions]
  );

  const recentTransactions = useMemo(() => transactions.slice(0, 6), [transactions]);

  const maxChartVal = 24;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">dashboard</span>
            <span>Ringkasan Operasional · {settings.schoolName}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold text-on-surface tracking-tight mt-1">
            Dashboard &amp; Ringkasan Perpustakaan
          </h1>
          <p className="text-[13px] text-on-surface-variant mt-1">
            Pantau pergerakan sirkulasi buku, keterlambatan pengembalian, dan ketersediaan koleksi secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('member-card', { memberId: members[0]?.id || 'ANG-0842' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] font-semibold border border-outline-variant/40 hover:bg-surface-container-high transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-primary">badge</span>
            <span>Kartu Digital Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('catalog')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] font-semibold border border-outline-variant/40 hover:bg-surface-container-high transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-primary">menu_book</span>
            <span>Katalog Buku</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('circulation')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">sync_alt</span>
            <span>Meja Sirkulasi</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold text-on-surface-variant">Total Koleksi Fisik</p>
              <p className="font-display text-2xl font-bold text-on-surface tabular-nums mt-1">
                {stats.totalCopies}{' '}
                <span className="text-sm font-normal text-on-surface-variant">Eksemplar</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">library_books</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs">
            <span className="text-on-surface-variant tabular-nums">
              {stats.totalTitles} judul katalog
            </span>
            <span className="font-semibold text-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded tabular-nums">
              {stats.availableCopies} di rak
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold text-on-surface-variant">Sirkulasi Aktif</p>
              <p className="font-display text-2xl font-bold text-primary tabular-nums mt-1">
                {stats.activeLoans.length}{' '}
                <span className="text-sm font-normal text-on-surface-variant">Transaksi</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">sync_alt</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs">
            <span className="text-on-surface-variant tabular-nums">
              {stats.borrowedCopies} buku sedang dipinjam
            </span>
            <span className="font-semibold text-primary tabular-nums">
              Maks {settings.maxLoansPerMember}/siswa
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold text-on-surface-variant">Kepatuhan Anggota</p>
              <p className="font-display text-2xl font-bold text-tertiary-container tabular-nums mt-1">
                {stats.avgCompliance}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs">
            <span className="text-on-surface-variant tabular-nums">
              {members.length} anggota terdaftar
            </span>
            <span className="font-semibold text-on-surface-variant tabular-nums">
              {stats.onTimeReturned}/{stats.returnedLoans.length} tepat waktu
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold text-on-surface-variant">Perlu Tindak Lanjut</p>
              <p className="font-display text-2xl font-bold text-error tabular-nums mt-1">
                {stats.overdueLoans.length + stats.dueTodayLoans.length}{' '}
                <span className="text-sm font-normal text-on-surface-variant">Pinjaman</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs">
            <span className="text-on-surface-variant tabular-nums">
              {stats.outOfStockBooks.length} judul stok habis
            </span>
            <span className="font-mono font-semibold text-error tabular-nums">
              {formatRupiah(stats.activeFines)}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Analytical & Action Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Circulation Chart + Distribution */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 flex flex-col justify-between space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Grafik Aktivitas Sirkulasi Mingguan
              </h2>
              <p className="text-xs text-on-surface-variant">
                Perbandingan volume peminjaman vs pengembalian (19 – 24 Okt 2023)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <span className="text-on-surface-variant font-medium">Peminjaman</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-tertiary-fixed-dim" />
                <span className="text-on-surface-variant font-medium">Pengembalian</span>
              </div>
            </div>
          </div>

          {/* Crisp Column Chart */}
          <div className="pt-2">
            <div className="grid grid-cols-6 gap-3 items-end h-44 px-2 pb-2 border-b border-surface-container">
              {WEEKLY_ACTIVITY.map((d) => {
                const loanH = Math.round((d.loans / maxChartVal) * 100);
                const retH = Math.round((d.returns / maxChartVal) * 100);
                return (
                  <div key={d.day} className="flex flex-col items-center h-full justify-end gap-2">
                    <div className="flex items-end justify-center gap-1.5 w-full h-36">
                      <div className="flex flex-col items-center justify-end h-full w-4 sm:w-5 group">
                        {d.loans > 0 && (
                          <span className="text-[10px] font-mono text-primary font-semibold mb-1 tabular-nums">
                            {d.loans}
                          </span>
                        )}
                        <div
                          className="w-full rounded-t-md bg-primary transition-all duration-300"
                          style={{ height: `${Math.max(d.loans > 0 ? 12 : 4, loanH)}%` }}
                          title={`Peminjaman ${d.date}: ${d.loans} buku`}
                        />
                      </div>
                      <div className="flex flex-col items-center justify-end h-full w-4 sm:w-5">
                        {d.returns > 0 && (
                          <span className="text-[10px] font-mono text-tertiary-container font-semibold mb-1 tabular-nums">
                            {d.returns}
                          </span>
                        )}
                        <div
                          className="w-full rounded-t-md bg-tertiary-fixed-dim transition-all duration-300"
                          style={{ height: `${Math.max(d.returns > 0 ? 12 : 4, retH)}%` }}
                          title={`Pengembalian ${d.date}: ${d.returns} buku`}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-on-surface">{d.day}</p>
                      <p className="text-[10px] text-outline tabular-nums">{d.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Collection Distribution Bar */}
          <div className="p-4 rounded-xl bg-surface-container-low space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-on-surface">
                Distribusi Stok Koleksi Real-time
              </span>
              <span className="text-on-surface-variant tabular-nums">
                {stats.availableCopies} tersedia ({stats.availPct}%) · {stats.borrowedCopies} dipinjam ({stats.borrowedPct}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden flex">
              <div
                className="h-full bg-tertiary-container transition-all duration-500"
                style={{ width: `${stats.availPct}%` }}
                title="Tersedia di Rak"
              />
              <div
                className="h-full bg-secondary-container transition-all duration-500"
                style={{ width: `${stats.borrowedPct}%` }}
                title="Sedang Dipinjam"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-on-surface-variant pt-0.5">
              <span>Denda Terkumpul: <strong className="font-mono text-on-surface">{formatRupiah(stats.collectedFines)}</strong></span>
              <span>Kartu Diblokir: <strong className="font-mono text-error">{stats.blockedCards}</strong></span>
            </div>
          </div>
        </div>

        {/* Attention Queue */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Prioritas Penanganan Hari Ini
              </h2>
              <p className="text-xs text-on-surface-variant">
                Pinjaman terlambat, jatuh tempo, dan stok kosong
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('circulation')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Semua Transaksi →
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {attentionTransactions.length === 0 ? (
              <div className="p-5 rounded-xl bg-tertiary-fixed/40 text-center space-y-1">
                <span className="material-symbols-outlined text-2xl text-tertiary-container">
                  task_alt
                </span>
                <p className="text-sm font-semibold text-tertiary-container">
                  Seluruh Sirkulasi Terkendali
                </p>
                <p className="text-xs text-on-surface-variant">
                  Tidak ada pinjaman terlambat atau jatuh tempo hari ini.
                </p>
              </div>
            ) : (
              attentionTransactions.map((tx) => {
                const m = members.find((mem) => mem.id === tx.memberId);
                const b = books.find((bk) => bk.id === tx.bookId);
                const isOverdue = tx.status === 'overdue';
                return (
                  <div
                    key={tx.id}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      isOverdue
                        ? 'bg-error-container/25 border-error/20'
                        : 'bg-secondary-fixed/35 border-secondary/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-primary">
                            {tx.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isOverdue
                                ? 'bg-error text-on-error'
                                : 'bg-secondary text-on-secondary'
                            }`}
                          >
                            {isOverdue
                              ? `Terlambat ${tx.overdueDays} hr`
                              : 'Jatuh Tempo Hari Ini'}
                          </span>
                        </div>
                        <p className="text-[13px] font-semibold text-on-surface truncate mt-1">
                          {b?.title || tx.bookId}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          Peminjam:{' '}
                          <button
                            type="button"
                            onClick={() =>
                              m && navigate('member-detail', { memberId: m.id })
                            }
                            className="font-semibold text-primary hover:underline cursor-pointer"
                          >
                            {m?.name || tx.memberId}
                          </button>
                          {isOverdue && (
                            <span className="ml-2 font-mono text-error font-semibold">
                              · Denda {formatRupiah(tx.overdueDays * settings.finePerDay)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          const completed = processReturn(tx.id);
                          if (completed) {
                            navigate('receipt', { transactionId: completed.id });
                          }
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                      >
                        Proses Kembali &amp; Struk
                      </button>
                      <button
                        type="button"
                        onClick={() => extendLoan(tx.id, settings.defaultLoanDays)}
                        className="py-1.5 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-semibold border border-outline-variant/40 hover:bg-surface-container-high transition-colors cursor-pointer"
                      >
                        +{settings.defaultLoanDays} Hari
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Out of stock quick alert */}
            {stats.outOfStockBooks.length > 0 && (
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-secondary">
                      inventory_2
                    </span>
                    <span className="text-xs font-semibold text-on-surface">
                      Koleksi Stok Kosong ({stats.outOfStockBooks.length} Judul)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('catalog')}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Kelola Stok
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 truncate">
                  {stats.outOfStockBooks.map((b) => b.title).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 overflow-hidden">
        <div className="p-5 border-b border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-on-surface">
              Aktivitas Sirkulasi Terbaru
            </h2>
            <p className="text-xs text-on-surface-variant">
              Klik baris anggota untuk melihat riwayat detail, atau buka struk pengembalian.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('members')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">group</span>
            <span>Direktori Anggota ({members.length})</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">ID Transaksi</th>
                <th className="py-3 px-4">Koleksi Buku</th>
                <th className="py-3 px-4">Anggota</th>
                <th className="py-3 px-4">Tgl Pinjam / Tempo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-[13px]">
              {recentTransactions.map((tx) => {
                const book = books.find((b) => b.id === tx.bookId);
                const member = members.find((m) => m.id === tx.memberId);
                return (
                  <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-primary whitespace-nowrap">
                      {tx.id}
                      <span className="block text-[10px] font-normal text-outline">
                        {tx.refCode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 min-w-[200px]">
                        <SafeImage
                          src={book?.coverUrl || ''}
                          alt={book?.title || tx.bookId}
                          className="w-8 h-11 rounded object-cover flex-shrink-0 shadow-xs"
                          fallbackIcon="menu_book"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface truncate max-w-[220px]">
                            {book?.title || tx.bookId}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {book?.id} · {book?.shelfLocation}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          member && navigate('member-detail', { memberId: member.id })
                        }
                        className="text-left group cursor-pointer"
                      >
                        <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {member?.name || tx.memberId}
                        </p>
                        <p className="text-xs text-on-surface-variant font-mono">
                          {member?.id} · {member?.className}
                        </p>
                      </button>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums text-xs">
                      <p className="text-on-surface font-medium">{tx.borrowDate}</p>
                      <p className="text-on-surface-variant">Tempo: {tx.dueDate}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.status === 'returned' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                          Dikembalikan
                        </span>
                      )}
                      {tx.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-tertiary-container text-xs font-semibold">
                          Dipinjam
                        </span>
                      )}
                      {tx.status === 'due_today' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-secondary text-xs font-semibold">
                          Jatuh Tempo
                        </span>
                      )}
                      {tx.status === 'overdue' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-error text-xs font-semibold">
                          Terlambat {tx.overdueDays}h
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {tx.status === 'returned' ? (
                        <button
                          type="button"
                          onClick={() => navigate('receipt', { transactionId: tx.id })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-fixed text-primary text-xs font-semibold hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">receipt_long</span>
                          <span>Lihat Struk</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('circulation')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                        >
                          <span>Kelola</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

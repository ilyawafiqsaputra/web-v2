import React, { useState } from 'react';
import { SafeImage } from '../components/SafeImage';
import { useLibrary } from '../context/LibraryContext';
import { formatRupiah } from '../data/libraryData';

export const ReceiptPage: React.FC = () => {
  const {
    selectedTransactionId,
    transactions,
    members,
    books,
    settings,
    navigate,
    showToast,
  } = useLibrary();

  const tx =
    transactions.find((t) => t.id === selectedTransactionId) ||
    transactions.find((t) => t.id === 'TR-2023-1878') ||
    transactions[0];

  const member = members.find((m) => m.id === tx.memberId) || members[0];
  const book = books.find((b) => b.id === tx.bookId) || books[0];

  const [printFormat, setPrintFormat] = useState<'thermal' | 'a5'>('thermal');
  const [includeQrAndStamp, setIncludeQrAndStamp] = useState<boolean>(true);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareEmail, setShareEmail] = useState<string>(member.email);
  const [sharePhone, setSharePhone] = useState<string>(member.phone);

  const fineTotal = tx.fineAmount || tx.overdueDays * settings.finePerDay;
  const receiptNumber = tx.receiptNumber || `STR-2023-1024-${tx.id.slice(-3)}`;

  const handleDownloadSlip = () => {
    const text = [
      settings.schoolName.toUpperCase(),
      settings.libraryUnit.toUpperCase(),
      settings.address,
      '----------------------------------------',
      `NO. BUKTI     : ${receiptNumber}`,
      `NO. TRX PINJAM: ${tx.id}`,
      `WAKTU KEMBALI : ${tx.returnDate || '24 Okt 2023'} ${tx.returnTime || '14:32:09'}`,
      `PUSTAKAWAN    : ${tx.librarianName}`,
      `ANGGOTA       : ${member.name} (${member.id})`,
      '----------------------------------------',
      `KOLEKSI       : [${book.id}] ${book.title}`,
      `RAK           : ${book.shelfLocation}`,
      `KETERLAMBATAN : ${tx.overdueDays} Hari Kalender`,
      `TOTAL DENDA   : ${formatRupiah(fineTotal)}`,
      `STATUS        : ${fineTotal > 0 ? 'LUNAS (PAID)' : 'SELESAI (NIHIL DENDA)'}`,
      '----------------------------------------',
      '*** SIMPAN STRUK INI SEBAGAI BUKTI SAH ***',
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bukti_Pengembalian_${tx.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Berkas tanda terima ${tx.id} berhasil diunduh!`, 'success');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 no-print">
        <nav className="flex items-center gap-1.5 text-on-surface-variant text-[13px] font-medium">
          <button
            type="button"
            onClick={() => navigate('circulation')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Sirkulasi &amp; Transaksi
          </button>
          <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
          <button
            type="button"
            onClick={() => navigate('circulation')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Pengembalian Buku
          </button>
          <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
          <span className="text-primary font-semibold">
            Bukti Pengembalian &amp; Cetak Struk (#{tx.id})
          </span>
        </nav>

        <div className="flex items-center gap-1.5 font-mono text-[12px] text-on-surface-variant bg-surface-container px-3 py-1 rounded">
          <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
          <span>SYNC ID: SYNC-OK-88421</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-6 no-print">
        <div className="flex flex-col max-w-2xl">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold uppercase tracking-wider">
              Status: Lunas &amp; Restorasi Sukses
            </span>
            <span className="text-outline">·</span>
            <span className="font-mono text-on-surface-variant">
              {tx.returnDate || '24 Okt 2023'} · {tx.returnTime?.slice(0, 5) || '14:32'} WIB
            </span>
          </div>
          <h1 className="font-display text-[28px] leading-[36px] font-bold text-primary tracking-tight mt-1">
            Bukti Pengembalian &amp; Pelunasan Denda
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Verifikasi penyelesaian transaksi pengembalian buku, pemulihan stok inventaris, dan cetak tanda terima denda keterlambatan sirkulasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('circulation')}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-lowest text-on-surface rounded-lg text-[13px] font-semibold shadow-xs hover:bg-surface-container-high transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Kembali ke Sirkulasi</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShareEmail(member.email);
              setSharePhone(member.phone);
              setShareModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-highest text-primary text-[13px] font-semibold rounded-lg hover:bg-primary-fixed transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">send</span>
            <span>Kirim ke WhatsApp/Email</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:bg-primary-container transition-all shadow-xs whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Cetak Struk Resmi</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      <div className="mb-6 p-4 bg-tertiary-fixed rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-[17px] font-bold text-tertiary">
                Transaksi Pengembalian Berhasil Diproses!
              </span>
              <span className="px-2 py-0.5 bg-tertiary text-on-tertiary rounded text-[11px] font-semibold uppercase">
                Restored +1
              </span>
            </div>
            <p className="text-[12px] text-on-tertiary-fixed-variant mt-0.5">
              Stok buku fisik <strong>&ldquo;{book.title}&rdquo; (ID: {book.id})</strong> otomatis dipulihkan ke {book.shelfLocation}.{' '}
              {fineTotal > 0
                ? `Pembayaran denda keterlambatan sebesar ${formatRupiah(fineTotal)} telah terverifikasi lunas di Buku Kas Kasir.`
                : 'Tidak ada tagihan denda keterlambatan pada transaksi ini.'}
            </p>
          </div>
        </div>
        <span className="font-mono text-[12px] text-tertiary px-3 py-1 bg-surface-container-lowest/85 rounded self-end md:self-auto flex-shrink-0">
          REF: {tx.refCode}
        </span>
      </div>

      {/* Main Grid: Left Audit Flow & Right Thermal Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 no-print">
          {/* Step Flow Status Metric */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Alur Audit Transaksi Sirkulasi
              </span>
              <span className="font-mono text-[12px] text-tertiary font-semibold">
                Selesai Tanpa Sengketa
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  1. Pengecekan Fisik
                </span>
                <span className="font-display text-[17px] font-bold text-tertiary mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">check_circle</span> Mulus
                </span>
                <span className="text-[12px] text-on-surface-variant mt-0.5">
                  Semua halaman &amp; cover utuh
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  2. Rekapitulasi Denda
                </span>
                <span className="font-display text-[17px] font-bold text-secondary mt-1 flex items-center gap-1 tabular-nums">
                  <span className="material-symbols-outlined text-base">schedule</span>{' '}
                  {tx.overdueDays} Hari
                </span>
                <span className="text-[12px] text-on-surface-variant mt-0.5">
                  {formatRupiah(settings.finePerDay)} / hari keterlambatan
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  3. Kasir &amp; Stok
                </span>
                <span className="font-display text-[17px] font-bold text-primary mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">task_alt</span> Lunas
                </span>
                <span className="text-[12px] text-on-surface-variant mt-0.5">
                  Stok +1 &amp; Kas Masuk
                </span>
              </div>
            </div>
          </div>

          {/* Member & Circulation Meta Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-display text-[17px] font-bold">
                <span className="material-symbols-outlined">badge</span>
                <h2>Informasi Anggota &amp; Rentang Pinjam</h2>
              </div>
              <span className="font-mono text-[12px] bg-surface-container px-2.5 py-0.5 rounded text-primary font-semibold">
                #{tx.id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-display text-base font-bold flex-shrink-0">
                  {member.initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => navigate('member-detail', { memberId: member.id })}
                      className="text-[15px] font-bold text-on-surface hover:text-primary cursor-pointer"
                    >
                      {member.name}
                    </button>
                    <span className="material-symbols-outlined text-tertiary text-sm">verified</span>
                  </div>
                  <span className="text-[12px] text-on-surface-variant">
                    {member.id} · {member.role} ({member.department})
                  </span>
                  <span className="text-[12px] text-outline mt-1 truncate">{member.email}</span>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-1.5 text-[12px] text-on-surface-variant md:border-l md:border-surface-container-highest md:pl-4">
                <div className="flex items-center justify-between">
                  <span>Tanggal Peminjaman:</span>
                  <span className="font-mono font-semibold text-on-surface">{tx.borrowDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Batas Jatuh Tempo:</span>
                  <span className="font-mono font-semibold text-error">{tx.dueDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tanggal Pengembalian:</span>
                  <span className="font-mono font-semibold text-tertiary">
                    {tx.returnDate || '24 Okt 2023'} ({tx.returnTime?.slice(0, 5) || '14:15'} WIB)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Selisih Keterlambatan:</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                      tx.overdueDays > 0
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-tertiary-fixed text-tertiary-container'
                    }`}
                  >
                    {tx.overdueDays > 0 ? `Terlambat ${tx.overdueDays} Hari` : 'Tepat Waktu'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Returned Book Details Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-display text-[17px] font-bold">
                <span className="material-symbols-outlined">menu_book</span>
                <h2>Rincian Koleksi Buku yang Dikembalikan</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-tertiary-fixed text-tertiary text-[11px] font-semibold">
                1 Eksemplar
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-surface-container-low rounded-lg">
              <div className="w-24 h-32 flex-shrink-0 rounded shadow-sm overflow-hidden bg-surface-container">
                <SafeImage
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="bg-surface-container-highest text-primary px-2 py-0.5 rounded font-semibold">
                      ID: {book.id}
                    </span>
                    <span className="text-outline">ISBN: {book.isbn}</span>
                    <span className="text-on-surface-variant">Dewey: {book.ddcCode}</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-on-surface mt-1.5">{book.title}</h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">
                    Penulis: {book.author}
                  </p>
                  <p className="text-[12px] text-outline">
                    Penerbit: {book.publisher} · Tahun {book.year}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 mt-3 bg-surface-container-lowest p-2.5 rounded-lg">
                  <div>
                    <span className="text-[11px] text-outline block">Status Fisik</span>
                    <span className="text-[12px] text-tertiary flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-sm">check</span> Baik &amp; Utuh
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-outline block">Barcode &amp; RFID</span>
                    <span className="text-[12px] text-tertiary flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-sm">check</span> Terbaca Jelas
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-outline block">Lokasi Rak Kembali</span>
                    <span className="font-mono text-[12px] text-primary font-semibold">
                      {book.shelfLocation}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-primary text-base mt-0.5">
                rate_review
              </span>
              <div className="flex flex-col text-on-surface-variant">
                <span className="text-[11px] font-semibold text-primary">
                  Catatan Pemeriksaan Pustakawan:
                </span>
                <p className="text-[12px] mt-0.5">
                  &ldquo;
                  {tx.conditionCheck ||
                    'Pemeriksaan nomor segel barcode RFID lolos uji sensor gerbang masuk. Halaman lengkap tanpa coretan pena basah.'}
                  &rdquo;
                </p>
                <span className="font-mono text-[11px] text-outline mt-1">
                  Diperiksa oleh: {tx.librarianName} (Pustakawan Pelaksana Sirkulasi)
                </span>
              </div>
            </div>
          </div>

          {/* Fine Breakdown & Settlement Ledger */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-primary font-display text-[17px] font-bold">
                <span className="material-symbols-outlined">calculate</span>
                <h2>Rincian Perhitungan Denda Keterlambatan</h2>
              </div>
              <span className="font-mono text-[11px] text-secondary bg-secondary-fixed px-2.5 py-0.5 rounded font-semibold">
                Tarif Reguler SK-PERPUS/2023
              </span>
            </div>

            <div className="bg-surface-container-low rounded-lg p-4 flex flex-col gap-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-base">timelapse</span>
                  <span>
                    Keterlambatan Pengembalian ({tx.overdueDays} Hari ×{' '}
                    {formatRupiah(settings.finePerDay)})
                  </span>
                </div>
                <span className="font-mono font-semibold tabular-nums">
                  {formatRupiah(fineTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-base">
                    auto_fix_high
                  </span>
                  <span>Biaya Kerusakan / Pemulihan Fisik Buku</span>
                </div>
                <span className="font-mono text-tertiary">Rp 0 (Kondisi Baik)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-base">
                    receipt_long
                  </span>
                  <span>Biaya Administrasi Sirkulasi Perpustakaan</span>
                </div>
                <span className="font-mono text-tertiary">Rp 0 (Bebas Biaya)</span>
              </div>
              <div className="h-px bg-surface-container-highest my-1" />
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[15px] font-bold text-on-surface">Total Kewajiban Denda</span>
                  <span className="text-[11px] text-outline">
                    Sudah termasuk pembulatan resmi sistem
                  </span>
                </div>
                <span className="font-display text-[22px] text-primary font-bold tabular-nums">
                  {formatRupiah(fineTotal)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-tertiary font-bold">
                    Status Pelunasan Kasir
                  </span>
                  <span className="font-display text-[17px] font-bold text-on-tertiary-fixed">
                    {fineTotal > 0 ? 'LUNAS - TUNAI (CASH)' : 'BEBAS DENDA - SELESAI'}
                  </span>
                  <span className="text-[12px] text-on-tertiary-fixed-variant">
                    {fineTotal > 0
                      ? `Uang diterima pas ${formatRupiah(fineTotal)} · Kembalian Rp 0`
                      : 'Pengembalian tepat waktu tanpa tunggakan'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:items-end font-mono text-[12px]">
                <span className="text-tertiary font-semibold">KASIR: {tx.librarianName}</span>
                <span className="text-on-tertiary-fixed-variant">BATCH: 20231024-K01</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Thermal Physical Struk Receipt Preview */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-20">
          {/* Print Configuration Toolbar */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex flex-col gap-3 no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary text-[13px] font-semibold">
                <span className="material-symbols-outlined text-base">settings_ethernet</span>
                <span>Konfigurasi Format Cetak</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                {printFormat === 'thermal' ? 'Kertas Thermal' : 'Format A5'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`py-2 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  printFormat === 'thermal'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">receipt</span>
                <span>Thermal 80mm</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a5')}
                className={`py-2 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  printFormat === 'a5'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span>Kwitansi A5</span>
              </button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-on-surface">
              <input
                type="checkbox"
                checked={includeQrAndStamp}
                onChange={(e) => setIncludeQrAndStamp(e.target.checked)}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
              <span>Sertakan Stempel Digital &amp; QR Validasi</span>
            </label>
          </div>

          {/* Receipt Paper Simulator */}
          <div
            className={`relative bg-surface-container-lowest rounded-xl shadow-md p-6 flex flex-col overflow-hidden mx-auto w-full transition-all ${
              printFormat === 'thermal' ? 'max-w-md' : 'max-w-full border border-outline-variant/40'
            }`}
          >
            {/* Serrated Top Edge */}
            {printFormat === 'thermal' && (
              <div className="w-full flex justify-between absolute -top-1.5 left-0 right-0 px-2 overflow-hidden opacity-45">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className="w-2.5 h-2.5 bg-surface rounded-full flex-shrink-0" />
                ))}
              </div>
            )}

            <div className="pt-2 flex flex-col font-mono text-[12px] text-on-surface">
              {/* Header */}
              <div className="text-center flex flex-col items-center">
                <span className="font-display text-[15px] text-primary font-bold tracking-tight uppercase">
                  PERPUSTAKAAN {settings.schoolName}
                </span>
                <span className="text-[11px] text-on-surface-variant font-semibold uppercase">
                  {settings.libraryUnit}
                </span>
                <span className="text-[10px] text-outline mt-0.5">{settings.address}</span>
                <span className="text-[10px] text-outline">
                  Telp: {settings.phone} · {settings.email}
                </span>
                <span className="text-[10px] text-outline mt-0.5">
                  Jam Layanan: Senin - Sabtu {settings.operatingHours}
                </span>
              </div>

              <div className="w-full my-3 border-b border-dashed border-outline-variant" />

              {/* Meta Receipt Numbers */}
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-outline">NO. BUKTI :</span>
                  <span className="font-bold text-on-surface">{receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">NO. TRX PINJAM:</span>
                  <span className="font-bold text-on-surface">{tx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">WAKTU KEMBALI:</span>
                  <span>
                    {tx.returnDate || '24/10/2023'} {tx.returnTime || '14:32:09'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">PUSTAKAWAN/KSR:</span>
                  <span>{tx.librarianName} (K01)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">ANGGOTA :</span>
                  <span className="font-semibold text-right">
                    {member.name} ({member.id})
                  </span>
                </div>
              </div>

              <div className="w-full my-3 border-b border-dashed border-outline-variant" />

              {/* Item Table */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-bold text-[11px] text-outline">
                  <span>DESKRIPSI KOLEKSI</span>
                  <span>STATUS</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between font-semibold gap-2">
                    <span className="truncate">
                      [{book.id}] {book.title}
                    </span>
                    <span className="text-tertiary flex-shrink-0">DIKEMBALIKAN</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-on-surface-variant">
                    <span>Qty: 1 Eks (Kondisi: BAIK)</span>
                    <span>{book.shelfLocation}</span>
                  </div>
                </div>
              </div>

              <div className="w-full my-3 border-b border-dashed border-outline-variant" />

              {/* Fine Calculations */}
              <div className="flex flex-col gap-1 text-[11px] tabular-nums">
                <div className="flex justify-between">
                  <span>Tgl Rencana Kembali:</span>
                  <span>{tx.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tgl Realisasi:</span>
                  <span>{tx.returnDate || '24 Okt 2023'}</span>
                </div>
                <div
                  className={`flex justify-between font-medium ${
                    tx.overdueDays > 0 ? 'text-error' : 'text-tertiary'
                  }`}
                >
                  <span>Keterlambatan:</span>
                  <span>{tx.overdueDays} Hari Kalender</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Tarif Denda per Hari:</span>
                  <span>{formatRupiah(settings.finePerDay)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Biaya Penggantian/Fisik:</span>
                  <span>Rp 0</span>
                </div>

                <div className="w-full my-1.5 border-b border-dashed border-outline-variant" />

                <div className="flex justify-between text-[13px] font-bold text-primary">
                  <span>TOTAL DENDA:</span>
                  <span>{formatRupiah(fineTotal)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-0.5">
                  <span>PEMBAYARAN (TUNAI):</span>
                  <span>{formatRupiah(fineTotal)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>KEMBALIAN:</span>
                  <span>Rp 0</span>
                </div>
                <div className="flex justify-between text-tertiary font-bold text-[12px] pt-1">
                  <span>STATUS:</span>
                  <span>{fineTotal > 0 ? 'LUNAS (PAID)' : 'SELESAI (NIHIL)'}</span>
                </div>
              </div>

              {includeQrAndStamp && (
                <>
                  <div className="w-full my-3 border-b border-dashed border-outline-variant" />
                  <div className="flex flex-col items-center gap-2 py-1">
                    <div className="p-2 border border-dashed border-tertiary/40 rounded bg-tertiary-fixed/30 text-center w-full">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-tertiary">
                        STEMPEL VALIDASI DIGITAL SISTEM SIRKULASI
                      </span>
                      <span className="block text-[9px] text-on-surface-variant">
                        SECURE-HASH: {member.qrTokenHash}
                      </span>
                      <span className="block text-[9px] text-tertiary font-semibold mt-0.5">
                        TERVERIFIKASI OTOMATIS OLEH SERVER PERPUS
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 bg-white rounded shadow-xs w-28 h-28 my-1">
                      <svg className="w-24 h-24" viewBox="0 0 100 100">
                        <rect fill="#00236f" height="28" rx="3" width="28" x="10" y="10" />
                        <rect fill="#ffffff" height="16" rx="2" width="16" x="16" y="16" />
                        <rect fill="#00236f" height="8" rx="1" width="8" x="20" y="20" />
                        <rect fill="#00236f" height="28" rx="3" width="28" x="62" y="10" />
                        <rect fill="#ffffff" height="16" rx="2" width="16" x="68" y="16" />
                        <rect fill="#00236f" height="8" rx="1" width="8" x="72" y="20" />
                        <rect fill="#00236f" height="28" rx="3" width="28" x="10" y="62" />
                        <rect fill="#ffffff" height="16" rx="2" width="16" x="16" y="68" />
                        <rect fill="#00236f" height="8" rx="1" width="8" x="20" y="72" />
                        <rect fill="#00236f" height="6" width="6" x="44" y="12" />
                        <rect fill="#00236f" height="6" width="6" x="52" y="18" />
                        <rect fill="#00236f" height="6" width="6" x="44" y="28" />
                        <rect fill="#00236f" height="6" width="6" x="12" y="44" />
                        <rect fill="#00236f" height="6" width="6" x="22" y="50" />
                        <rect fill="#00236f" height="6" width="6" x="32" y="44" />
                        <rect fill="#00236f" height="12" width="12" x="44" y="44" />
                        <rect fill="#00236f" height="6" width="6" x="60" y="44" />
                        <rect fill="#00236f" height="6" width="6" x="70" y="50" />
                        <rect fill="#00236f" height="6" width="6" x="80" y="44" />
                        <rect fill="#00236f" height="6" width="6" x="44" y="64" />
                        <rect fill="#00236f" height="6" width="6" x="52" y="72" />
                        <rect fill="#00236f" height="6" width="6" x="44" y="80" />
                        <rect fill="#00236f" height="8" width="8" x="64" y="64" />
                        <rect fill="#00236f" height="6" width="10" x="76" y="72" />
                        <rect fill="#00236f" height="8" width="8" x="64" y="80" />
                      </svg>
                      <span className="text-[8px] text-outline mt-1">SCAN UNTUK VALIDASI</span>
                    </div>
                  </div>
                </>
              )}

              <p className="text-[10px] text-center text-outline leading-tight px-3 mt-2">
                &ldquo;Buku telah diverifikasi dan masuk kembali ke inventaris. Terima kasih telah menjaga keutuhan koleksi perpustakaan.&rdquo;
              </p>
              <span className="text-[9px] text-center text-outline mt-1">
                *** SIMPAN STRUK INI SEBAGAI BUKTI SAH ***
              </span>
            </div>

            {printFormat === 'thermal' && (
              <div className="w-full flex justify-between absolute -bottom-1.5 left-0 right-0 px-2 overflow-hidden opacity-45">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className="w-2.5 h-2.5 bg-surface rounded-full flex-shrink-0" />
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons Below Receipt */}
          <div className="grid grid-cols-2 gap-3 no-print">
            <button
              type="button"
              onClick={handleDownloadSlip}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-container-lowest text-primary rounded-lg text-[13px] font-semibold shadow-xs hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              <span>Download Struk</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Digital Copy Modal */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-display text-[17px] font-bold">
                <span className="material-symbols-outlined">forward_to_inbox</span>
                <h3>Kirim Salinan Bukti Digital</h3>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-[12px] text-on-surface-variant">
              Kirim berkas PDF bukti pengembalian dan kwitansi lunas denda keterlambatan kepada anggota terdaftar.
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  Email Penerima
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                    mail
                  </span>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg text-on-surface text-[13px] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  Nomor WhatsApp (Aktif)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                    chat
                  </span>
                  <input
                    type="text"
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg text-on-surface text-[13px] focus:outline-none"
                  />
                </div>
              </div>
              <div className="p-2.5 bg-surface-container rounded-lg flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-tertiary text-base">attach_file</span>
                <span className="font-mono text-[11px] truncate">
                  Bukti_Pengembalian_{tx.id}.pdf (142 KB)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShareModalOpen(false);
                  showToast(
                    `Salinan struk PDF berhasil dikirim ke WhatsApp (${sharePhone}) & Email (${shareEmail})!`,
                    'success'
                  );
                }}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Kirim Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

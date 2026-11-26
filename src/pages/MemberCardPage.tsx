import React, { useState } from 'react';
import { SafeImage } from '../components/SafeImage';
import { useLibrary } from '../context/LibraryContext';
import { ASSETS } from '../data/libraryData';
import { CardBlockReason } from '../types';

export const MemberCardPage: React.FC = () => {
  const {
    selectedMemberId,
    members,
    transactions,
    books,
    settings,
    navigate,
    regenerateQrToken,
    blockMemberCard,
    unblockMemberCard,
    showToast,
  } = useLibrary();

  const member = members.find((m) => m.id === selectedMemberId) || members[0];
  const activeLoans = transactions.filter(
    (t) => t.memberId === member.id && t.status !== 'returned'
  );
  const firstActiveLoan = activeLoans[0];
  const firstActiveBook = firstActiveLoan
    ? books.find((b) => b.id === firstActiveLoan.bookId)
    : null;

  const [cardView, setCardView] = useState<'both' | 'front' | 'back'>('both');
  const [printMaterial, setPrintMaterial] = useState<'pvc' | 'a4' | 'mobile'>('pvc');
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [includeQr, setIncludeQr] = useState(true);
  const [includeStamp, setIncludeStamp] = useState(true);

  // Two-step Block Modal Workflow (Matches Confirm Modal + Success Multi-Channel Notification Modal)
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [blockReason, setBlockReason] = useState<CardBlockReason>('Kartu Fisik Hilang / Tercecer');
  const [blockNote, setBlockNote] = useState('');
  const [blockSuccessOpen, setBlockSuccessOpen] = useState(false);
  const [notifChannelTab, setNotifChannelTab] = useState<'wa' | 'email'>('wa');

  const quotaPct = Math.min(
    100,
    Math.round((activeLoans.length / settings.maxLoansPerMember) * 100)
  );
  const remainingSlots = Math.max(0, settings.maxLoansPerMember - activeLoans.length);

  const handleSimulateTap = () => {
    if (member.cardBlocked) {
      showToast(
        `AKSES DITOLAK: Kartu ${member.name} (${member.id}) berstatus DIBLOKIR! Token QR tidak valid.`,
        'error'
      );
    } else {
      showToast(
        `TAP DITERIMA: Gerbang Membuka. Siswa ${member.name} terverifikasi aktif!`,
        'success'
      );
    }
  };

  const handleConfirmBlock = () => {
    blockMemberCard(member.id, blockReason, blockNote);
    setBlockConfirmOpen(false);
    setBlockSuccessOpen(true);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-4 mb-6 no-print">
        <div className="flex flex-wrap items-center gap-1.5 text-on-surface-variant text-[13px] font-medium">
          <button
            type="button"
            onClick={() => navigate('members')}
            className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">group</span>
            <span>Daftar Anggota</span>
          </button>
          <span className="material-symbols-outlined text-xs text-outline">chevron_right</span>
          <button
            type="button"
            onClick={() => navigate('member-detail', { memberId: member.id })}
            className="text-on-surface hover:text-primary transition-colors cursor-pointer"
          >
            Profil Siswa ({member.name})
          </button>
          <span className="material-symbols-outlined text-xs text-outline">chevron_right</span>
          <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-mono text-[12px] font-semibold">
            {member.id} · Digital ID
          </span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <span className="text-[11px] uppercase tracking-wider text-tertiary-container font-bold">
              Terintegrasi Sistem Sirkulasi Perpustakaan {settings.schoolName}
            </span>
            <h1 className="font-display text-[28px] leading-[36px] text-on-surface tracking-tight font-bold mt-0.5">
              Kartu Anggota Digital &amp; Verifikasi Perpustakaan
            </h1>
            <p className="text-[14px] text-on-surface-variant mt-1">
              Kredensial ID Card resmi terintegrasi pita RFID, Barcode Code-128, dan QR Code dinamis untuk absensi gerbang perpus dan peminjaman mandiri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-[13px] font-semibold shadow-xs hover:bg-primary-container transition-all whitespace-nowrap cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Cetak Kartu PVC</span>
            </button>
            <button
              type="button"
              onClick={() =>
                showToast(`Berkas PDF HD SmartPass ${member.id} siap diunduh.`, 'success')
              }
              className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-high text-on-surface hover:bg-surface-variant rounded-xl text-[13px] font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Unduh PDF / HD</span>
            </button>
            <button
              type="button"
              onClick={() =>
                showToast(`Pass Digital ${member.name} siap ditambahkan ke Wallet.`, 'info')
              }
              className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-high text-on-surface hover:bg-surface-variant rounded-xl text-[13px] font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
              <span className="hidden sm:inline">Google / Apple Wallet</span>
            </button>
            <button
              type="button"
              onClick={() =>
                showToast(
                  `Kartu digital ${member.name} dikirim ke WhatsApp (${member.phone}).`,
                  'success'
                )
              }
              className="flex items-center gap-1.5 px-3 py-2 bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim rounded-xl text-[13px] font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span className="hidden sm:inline">Kirim WA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dynamic Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols): Physical/Digital ID Card Dual-Face Showcase */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Card View Toolbar */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="px-2 py-1 bg-surface-container rounded font-mono text-on-surface-variant font-medium">
                ISO/IEC 7810 ID-1 Standard
              </span>
              <span className="text-outline-variant">·</span>
              <span className="text-on-surface-variant font-mono">85.60 × 53.98 mm</span>
            </div>

            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
              {(
                [
                  { id: 'both', label: 'Berdampingan' },
                  { id: 'front', label: 'Depan' },
                  { id: 'back', label: 'Belakang' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCardView(tab.id)}
                  className={`px-3 py-1 rounded text-[12px] transition-all cursor-pointer ${
                    cardView === tab.id
                      ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* CARD 1: FRONT FACE */}
          {(cardView === 'both' || cardView === 'front') && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[12px] uppercase tracking-wider text-on-surface font-bold">
                  Muka Depan (Front Face)
                </span>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  SEC-CHIP · RFID 13.56 MHz
                </span>
              </div>

              <div
                className={`relative w-full aspect-[856/540] rounded-2xl overflow-hidden shadow-xl text-on-primary p-5 sm:p-7 flex flex-col justify-between select-none transition-all ${
                  member.cardBlocked
                    ? 'bg-gradient-to-br from-inverse-surface via-[#3b2025] to-[#1a1114]'
                    : 'bg-gradient-to-br from-primary-container via-primary to-inverse-surface'
                }`}
              >
                {/* Guilloche Pattern Overlay */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern height="40" id="guilloche" patternUnits="userSpaceOnUse" width="40">
                      <circle
                        cx="20"
                        cy="20"
                        fill="none"
                        r="18"
                        stroke="currentColor"
                        strokeDasharray="2 2"
                        strokeWidth="0.5"
                      />
                      <path
                        d="M0 20 Q10 0 20 20 T40 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect fill="url(#guilloche)" height="100%" width="100%" />
                </svg>

                {/* Top Header */}
                <div className="relative z-10 flex items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface-container-lowest p-1.5 shadow-md flex items-center justify-center flex-shrink-0">
                      <SafeImage
                        src={ASSETS.schoolCrest}
                        alt="Logo SMK Muhammadiyah Pakem"
                        className="w-full h-full object-contain"
                        fallbackIcon="school"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display text-[15px] sm:text-[18px] leading-tight font-extrabold tracking-tight text-surface-bright uppercase">
                        {settings.schoolName}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-secondary-fixed tracking-widest uppercase font-semibold">
                        Perpustakaan &amp; Pusat Literasi Digital
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="font-mono text-[11px] text-primary-fixed font-semibold tracking-wider">
                        SMARTPASS
                      </span>
                      <span className="text-[10px] text-surface-variant/80 font-semibold">
                        KARTU ANGGOTA
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-secondary-fixed/20 border border-secondary-fixed/30 flex items-center justify-center text-secondary-fixed">
                      <span className="material-symbols-outlined text-lg">contactless</span>
                    </div>
                  </div>
                </div>

                {/* Mid Body */}
                <div className="relative z-10 grid grid-cols-12 gap-3 sm:gap-5 items-center my-auto">
                  <div className="col-span-4 sm:col-span-3 flex flex-col items-center">
                    <div className="relative w-20 h-24 sm:w-24 sm:h-32 rounded-xl overflow-hidden shadow-lg ring-2 ring-surface-container-lowest/80 bg-surface-container-high">
                      <SafeImage
                        src={member.cardPhotoUrl || member.photoUrl}
                        alt={member.name}
                        className={`w-full h-full object-cover ${
                          member.cardBlocked ? 'grayscale opacity-75' : ''
                        }`}
                        fallbackText={member.initials}
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-primary/85 py-0.5 text-center">
                        <span className="text-on-primary font-bold text-[9px] uppercase tracking-wider">
                          {member.className}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-8 sm:col-span-9 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {member.cardBlocked ? (
                        <span className="px-2 py-0.5 rounded bg-error text-on-error text-[10px] font-bold">
                          KARTU DIBLOKIR
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                          AKTIF SISWA
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-primary-fixed-dim">
                        NO: {member.id}
                      </span>
                    </div>

                    <h2 className="font-display text-[20px] sm:text-[26px] font-bold tracking-tight text-surface-container-lowest truncate uppercase">
                      {member.name}
                    </h2>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1.5 text-[11px] sm:text-[12px]">
                      <div>
                        <span className="text-surface-variant/70 text-[10px] block">NIS / NISN</span>
                        <span className="font-mono font-semibold text-surface-bright">
                          {member.nisNisn}
                        </span>
                      </div>
                      <div>
                        <span className="text-surface-variant/70 text-[10px] block">
                          Berlaku Hingga
                        </span>
                        <span className="font-mono font-semibold text-secondary-fixed">
                          {member.validUntil}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-surface-variant/70 text-[10px] block">
                          Kompetensi Keahlian
                        </span>
                        <span className="text-[13px] sm:text-[14px] font-semibold text-tertiary-fixed-dim truncate block">
                          {member.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Bar */}
                <div className="relative z-10 pt-2 flex items-end justify-between gap-2">
                  {includeBarcode ? (
                    <div className="flex flex-col bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm">
                      <svg className="h-6 sm:h-7 w-32 sm:w-44 text-on-surface" fill="currentColor" viewBox="0 0 170 30">
                        <rect height="30" width="3" x="0" y="0" />
                        <rect height="30" width="1.5" x="5" y="0" />
                        <rect height="30" width="4" x="8" y="0" />
                        <rect height="30" width="2" x="14" y="0" />
                        <rect height="30" width="1" x="18" y="0" />
                        <rect height="30" width="5" x="22" y="0" />
                        <rect height="30" width="2" x="29" y="0" />
                        <rect height="30" width="3" x="33" y="0" />
                        <rect height="30" width="1.5" x="38" y="0" />
                        <rect height="30" width="4" x="42" y="0" />
                        <rect height="30" width="2" x="48" y="0" />
                        <rect height="30" width="1" x="52" y="0" />
                        <rect height="30" width="3" x="56" y="0" />
                        <rect height="30" width="2" x="62" y="0" />
                        <rect height="30" width="4" x="66" y="0" />
                        <rect height="30" width="1" x="73" y="0" />
                        <rect height="30" width="3" x="76" y="0" />
                        <rect height="30" width="5" x="82" y="0" />
                        <rect height="30" width="2" x="90" y="0" />
                        <rect height="30" width="2" x="94" y="0" />
                        <rect height="30" width="4" x="98" y="0" />
                        <rect height="30" width="1.5" x="105" y="0" />
                        <rect height="30" width="3" x="109" y="0" />
                        <rect height="30" width="2" x="114" y="0" />
                        <rect height="30" width="4" x="118" y="0" />
                        <rect height="30" width="1" x="124" y="0" />
                        <rect height="30" width="3.5" x="128" y="0" />
                        <rect height="30" width="2" x="134" y="0" />
                        <rect height="30" width="3" x="138" y="0" />
                        <rect height="30" width="4" x="144" y="0" />
                        <rect height="30" width="1" x="151" y="0" />
                        <rect height="30" width="3" x="154" y="0" />
                        <rect height="30" width="2" x="160" y="0" />
                        <rect height="30" width="4" x="164" y="0" />
                      </svg>
                      <span className="font-mono text-[9px] text-center text-on-surface-variant font-medium tracking-widest mt-0.5">
                        *{member.id.replace('-', '')}0067823910*
                      </span>
                    </div>
                  ) : (
                    <div />
                  )}

                  {includeStamp && (
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[9px] block text-surface-variant/80 uppercase">
                          Kepala Perpustakaan
                        </span>
                        <span className="text-xs font-bold text-surface-bright">
                          {settings.headLibrarianName}
                        </span>
                        <span className="font-mono text-[9px] block text-primary-fixed-dim">
                          NIP: {settings.headLibrarianNip}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center p-1 border border-secondary-container/40">
                        <span className="material-symbols-outlined text-secondary-fixed text-xl">
                          verified
                        </span>
                      </div>
                    </div>
                  )}

                  {includeQr && (
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-surface-container-lowest p-1 shadow-sm flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h4v4h-4v-4zm-4-4h4v4h-4v-4zm4-2h4v2h-4v-2zm-4 6h2v4h-2v-4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CARD 2: BACK FACE */}
          {(cardView === 'both' || cardView === 'back') && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[12px] uppercase tracking-wider text-on-surface font-bold">
                  Muka Belakang (Reverse Terms &amp; Policies)
                </span>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  SIPUS-TERMS-REV2023
                </span>
              </div>

              <div className="relative w-full aspect-[856/540] rounded-2xl overflow-hidden shadow-xl bg-surface-container-lowest text-on-surface p-5 sm:p-7 flex flex-col justify-between select-none">
                <div className="-mx-5 sm:-mx-7 -mt-5 sm:-mt-7 mb-3 h-10 sm:h-12 bg-inverse-surface flex items-center justify-between px-6">
                  <span className="font-mono text-[10px] text-surface-container-highest tracking-widest">
                    ENCRYPTED TRACK 2 · ISO 7811 HIGH COERCIVITY
                  </span>
                  <span className="font-mono text-[10px] text-surface-container-high/60">
                    SMK-M-PKM-SYS
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-primary uppercase tracking-wide">
                      Tata Tertib &amp; Regulasi Perpustakaan
                    </span>
                    <span className="font-mono text-[11px] text-outline">Ver. Pakem-2023.1</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] sm:text-[12px] text-on-surface-variant leading-relaxed">
                    <li>
                      <strong className="text-on-surface font-medium">Kewajiban Identitas:</strong>{' '}
                      Kartu wajib dibawa saat transaksi peminjaman/pengembalian dan akses gerbang literasi.
                    </li>
                    <li>
                      <strong className="text-on-surface font-medium">Batas Sirkulasi:</strong>{' '}
                      Maksimal peminjaman {settings.maxLoansPerMember} eksemplar buku selama{' '}
                      {settings.defaultLoanDays} hari kalender.
                    </li>
                    <li>
                      <strong className="text-on-surface font-medium">Sanksi Keterlambatan:</strong>{' '}
                      Keterlambatan pengembalian dikenakan denda administratif sesuai regulasi perpustakaan.
                    </li>
                    <li>
                      <strong className="text-on-surface font-medium">Integritas Kepemilikan:</strong>{' '}
                      Kartu ini diterbitkan khusus atas nama siswa dan dilarang dipindahtangankan.
                    </li>
                    <li>
                      <strong className="text-on-surface font-medium">Kehilangan:</strong>{' '}
                      Kehilangan kartu harap segera lapor ke bagian sirkulasi untuk penonaktifan token QR.
                    </li>
                  </ol>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-surface-container-low p-3 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-on-surface">
                      Perpustakaan {settings.schoolName}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">{settings.address}</span>
                  </div>
                  <div className="flex flex-col sm:text-right">
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      perpustakaan.smkmuhpakem.sch.id
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Telp: {settings.phone} · e-Perpus
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RFID Gate Sensor Simulation */}
          <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined">sensors</span>
              </div>
              <div>
                <h4 className="text-[15px] text-on-surface font-semibold">
                  Simulasi Sensor Tap RFID / Barcode Scanner
                </h4>
                <p className="text-[12px] text-on-surface-variant">
                  Uji responsivitas identitas di gerbang turnstile dan meja sirkulasi mandiri.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSimulateTap}
              className="px-4 py-2 bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary text-[13px] font-semibold rounded-lg shadow-xs transition-all whitespace-nowrap cursor-pointer"
            >
              Simulasi Tap Kartu
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Live Circulation Metrics, Print Specs & Administrative Controls */}
        <div className="xl:col-span-5 flex flex-col gap-6 no-print">
          {/* Validasi Status Keanggotaan */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">badge</span>
                <h3 className="text-[16px] text-on-surface font-bold">
                  Validasi Status Keanggotaan
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-xs ${
                  member.cardBlocked
                    ? 'bg-error-container text-error'
                    : 'bg-tertiary-fixed text-on-tertiary-fixed'
                }`}
              >
                {member.cardBlocked ? 'STATUS: DIBLOKIR' : 'TERVERIFIKASI AKTIF'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Kuota Peminjaman Siswa
                </span>
                <div className="flex items-baseline gap-2 mt-1 tabular-nums">
                  <span className="font-display text-[28px] font-bold text-primary">
                    {activeLoans.length}
                  </span>
                  <span className="text-[15px] text-on-surface-variant">
                    / {settings.maxLoansPerMember} Buku Dipinjam
                  </span>
                </div>
                <span className="text-[12px] text-tertiary-container font-medium mt-1">
                  Sisa {remainingSlots} slot buku dapat dipinjam minggu ini
                </span>
              </div>

              <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-highest"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${quotaPct}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-mono text-[12px] font-bold text-on-surface tabular-nums">
                  {quotaPct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-container-low">
                <span className="text-[11px] text-on-surface-variant block">
                  Kepatuhan Sirkulasi
                </span>
                <span className="text-[15px] font-bold text-tertiary-container flex items-center gap-1 mt-0.5 tabular-nums">
                  <span className="material-symbols-outlined text-sm">verified_user</span>{' '}
                  {member.complianceRate}%
                </span>
                <span className="text-[11px] text-on-surface-variant">0 Denda aktif tercatat</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low">
                <span className="text-[11px] text-on-surface-variant block">Aktivitas Terakhir</span>
                <span className="text-[14px] font-bold text-on-surface mt-0.5 block truncate">
                  {member.lastGateActivity}
                </span>
                <span className="text-[11px] text-on-surface-variant">Gerbang Turnstile Utama</span>
              </div>
            </div>

            {firstActiveLoan && firstActiveBook && (
              <div className="p-3 rounded-lg bg-surface-container-highest/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-primary text-base">
                    auto_stories
                  </span>
                  <div className="min-w-0">
                    <span className="text-[13px] text-on-surface font-semibold truncate block">
                      {firstActiveBook.title}
                    </span>
                    <span className="font-mono text-[11px] text-on-surface-variant">
                      Jatuh Tempo: {firstActiveLoan.dueDate}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-primary text-[11px] font-semibold flex-shrink-0">
                  Aktif
                </span>
              </div>
            )}
          </div>

          {/* Spesifikasi & Format Cetak */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">tune</span>
              <h3 className="text-[16px] text-on-surface font-bold">
                Spesifikasi &amp; Format Cetak
              </h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-on-surface-variant font-semibold uppercase">
                Pilihan Bahan / Layout Fisik
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'pvc', title: 'PVC Card', sub: 'Standar ID-1' },
                    { id: 'a4', title: 'Kertas A4', sub: 'Glossy + Potong' },
                    { id: 'mobile', title: 'Mobile Pass', sub: 'Wallet Digital' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrintMaterial(opt.id)}
                    className={`flex flex-col p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      printMaterial === opt.id
                        ? 'bg-primary-fixed text-on-primary-fixed ring-1 ring-primary/30'
                        : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-[12px] font-bold">{opt.title}</span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] text-on-surface-variant font-semibold uppercase">
                Komponen Keamanan &amp; Otentikasi
              </span>
              <label className="flex items-center gap-2.5 cursor-pointer py-1 text-[12px]">
                <input
                  type="checkbox"
                  checked={includeBarcode}
                  onChange={(e) => setIncludeBarcode(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span>Sertakan Barcode Code-128 untuk pemindai optik meja sirkulasi</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer py-1 text-[12px]">
                <input
                  type="checkbox"
                  checked={includeQr}
                  onChange={(e) => setIncludeQr(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span>
                  Sertakan QR Code Token Dinamis (<code className="font-mono">{member.qrTokenHash}</code>)
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer py-1 text-[12px]">
                <input
                  type="checkbox"
                  checked={includeStamp}
                  onChange={(e) => setIncludeStamp(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span>Tampilkan Cap Stempel Resmi &amp; Tanda Tangan Kepala Perpus</span>
              </label>
            </div>
          </div>

          {/* Aksi Khusus Petugas */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs flex flex-col gap-2.5">
            <h3 className="text-[16px] text-on-surface font-bold mb-1">
              Aksi Khusus Petugas Perpustakaan
            </h3>

            <button
              type="button"
              onClick={() => regenerateQrToken(member.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-base">refresh</span>
                <div>
                  <span className="text-[13px] font-semibold block">Regenerasi Kode Token QR</span>
                  <span className="text-[11px] text-on-surface-variant">
                    Cegah pemalsuan atau kloning tangkapan layar siswa
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
            </button>

            <button
              type="button"
              onClick={() =>
                showToast(`File e-Card PDF dikirim ke ${member.email}.`, 'success')
              }
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-base">mail</span>
                <div>
                  <span className="text-[13px] font-semibold block">
                    Kirim Salinan Digital ke Email Siswa
                  </span>
                  <span className="text-[11px] text-on-surface-variant">{member.email}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
            </button>

            {member.cardBlocked ? (
              <button
                type="button"
                onClick={() => unblockMemberCard(member.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-tertiary-fixed/60 hover:bg-tertiary-fixed transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary-container text-base">
                    lock_open
                  </span>
                  <div>
                    <span className="text-[13px] font-semibold block text-tertiary-container">
                      Aktifkan Kembali Kartu Siswa
                    </span>
                    <span className="text-[11px] text-on-tertiary-fixed-variant">
                      Pulihkan akses RFID turnstile &amp; hak pinjam mandiri
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[11px] font-semibold text-tertiary-container">
                  Aktifkan
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setBlockConfirmOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-error-container/40 hover:bg-error-container transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-error text-base">block</span>
                  <div>
                    <span className="text-[13px] font-semibold block text-error">
                      Bekukan / Blokir Kartu Sementara
                    </span>
                    <span className="text-[11px] text-error/80">
                      Jika kartu fisik dilaporkan tertinggal atau hilang
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[11px] font-semibold text-error">
                  Nonaktifkan
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL STEP 1: Konfirmasi Pemblokiran Kartu Anggota */}
      {blockConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-xs"
          onClick={() => setBlockConfirmOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-surface-container-high flex items-start justify-between gap-3 bg-gradient-to-r from-error-container/30 to-surface-container-lowest">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">warning</span>
                </div>
                <div>
                  <h3 className="font-display text-[17px] font-bold text-on-surface leading-tight">
                    Konfirmasi Pemblokiran Kartu Anggota
                  </h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">
                    Tindakan pengamanan preventif akun sirkulasi siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBlockConfirmOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
              {/* Student Summary Box */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center gap-3">
                <SafeImage
                  src={member.cardPhotoUrl || member.photoUrl}
                  alt={member.name}
                  className="w-12 h-14 rounded-lg object-cover ring-1 ring-surface-container-highest flex-shrink-0"
                  fallbackText={member.initials}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-on-surface truncate">
                      {member.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-primary font-mono text-[11px] font-semibold">
                      {member.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    NIS/NISN: <span className="font-mono text-on-surface">{member.nisNisn}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-semibold">
                      {member.className}
                    </span>
                    <span className="text-on-surface-variant truncate">{member.department}</span>
                  </div>
                </div>
              </div>

              {/* Reason Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wide">
                  Alasan Pemblokiran Kartu
                </label>
                {(
                  [
                    { value: 'Kartu Fisik Hilang / Tercecer', icon: 'credit_card_off' },
                    { value: 'Kartu Rusak / Chip RFID Error', icon: 'nfc' },
                    { value: 'Penyalahgunaan Akun oleh Orang Lain', icon: 'security' },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.value}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      blockReason === item.value
                        ? 'border-error bg-error-container/30'
                        : 'border-surface-container-highest bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="block_reason"
                        checked={blockReason === item.value}
                        onChange={() => setBlockReason(item.value)}
                        className="accent-error w-4 h-4"
                      />
                      <span className="text-[13px] font-medium text-on-surface">{item.value}</span>
                    </div>
                    <span
                      className={`material-symbols-outlined text-sm ${
                        blockReason === item.value ? 'text-error' : 'text-outline'
                      }`}
                    >
                      {item.icon}
                    </span>
                  </label>
                ))}
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface flex items-center justify-between">
                  <span>Catatan Petugas Perpustakaan</span>
                  <span className="text-outline font-normal">Opsional</span>
                </label>
                <textarea
                  rows={2}
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  placeholder="Contoh: Siswa melaporkan kartu hilang di area kantin sekolah saat istirahat..."
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-[12px] placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-error"
                />
              </div>

              {/* Impact Alert */}
              <div className="p-3 rounded-xl bg-error-container/30 border border-error-container text-error flex items-start gap-2">
                <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">
                  shield
                </span>
                <p className="text-[12px] leading-relaxed text-on-surface-variant">
                  <strong className="text-error font-semibold">Dampak Pemblokiran:</strong> Akses gerbang turnstile RFID, hak peminjaman mandiri, dan QR Code digital siswa akan langsung dinonaktifkan seketika.
                </p>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-surface-container-high flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-[13px] font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error text-on-error hover:opacity-90 text-[13px] font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">lock</span>
                <span>Ya, Blokir Kartu Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STEP 2: Simulasi Notifikasi Sukses Pemblokiran Kartu Siswa */}
      {blockSuccessOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-xs"
          onClick={() => setBlockSuccessOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-surface-container-high flex items-start justify-between gap-3 bg-gradient-to-r from-tertiary-fixed-dim/20 to-surface-container-lowest">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center flex-shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-2xl font-bold">check_circle</span>
                </div>
                <div>
                  <h3 className="font-display text-[17px] font-bold text-on-surface leading-tight">
                    Kartu Berhasil Diblokir &amp; Kredensial Diamankan
                  </h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">
                    Waktu Eksekusi:{' '}
                    <span className="font-medium text-on-surface">
                      {member.blockedAt || '24 Okt 2023, 14:45 WIB'}
                    </span>{' '}
                    · Pustakawan:{' '}
                    <span className="font-semibold text-primary">{settings.librarianName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBlockSuccessOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
              {/* Frozen Banner */}
              <div className="p-3 rounded-xl bg-error-container/30 border border-error-container/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-error text-xl flex-shrink-0">
                    phonelink_lock
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-error leading-tight">
                      Semua Akses Turnstile &amp; QR Dinamis Nonaktif
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      Hak pinjam mandiri dan sensor gerbang telah dibekukan.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold text-error bg-surface-container-lowest px-2 py-0.5 rounded shadow-xs flex-shrink-0">
                  {member.blockRefId || '#BLK-2023-0842'}
                </span>
              </div>

              {/* Multi-Channel Preview Tabs */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-base">
                      forward_to_inbox
                    </span>
                    <span>Pratinjau Pengiriman Notifikasi Multi-Channel Siswa</span>
                  </span>
                  <span className="text-[11px] text-tertiary-container font-semibold">
                    Transmisi Otomatis Berhasil
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container-high">
                  <button
                    type="button"
                    onClick={() => setNotifChannelTab('wa')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12px] transition-all cursor-pointer ${
                      notifChannelTab === 'wa'
                        ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    <span className="truncate">WhatsApp ({member.phone})</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-mono text-[10px] font-bold">
                      Terkirim ✓✓
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifChannelTab('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12px] transition-all cursor-pointer ${
                      notifChannelTab === 'email'
                        ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">mail</span>
                    <span className="truncate">Email ({member.email})</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-primary-fixed text-primary font-mono text-[10px] font-bold">
                      Delivered
                    </span>
                  </button>
                </div>

                {notifChannelTab === 'wa' ? (
                  <div className="flex flex-col rounded-xl border border-surface-container-high overflow-hidden bg-surface-container-low">
                    <div className="bg-surface-container p-3 border-b border-surface-container-high flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary font-bold text-xs">
                          PKM
                        </div>
                        <div>
                          <span className="text-[13px] font-bold text-on-surface block leading-tight">
                            Perpustakaan {settings.schoolName}
                          </span>
                          <span className="text-[10px] text-tertiary-container font-medium">
                            Akun Resmi Terverifikasi · Bot Notifikasi
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-on-surface-variant">
                        Hari ini, 14:45
                      </span>
                    </div>

                    <div className="p-4">
                      <div className="max-w-lg bg-surface-container-lowest p-3.5 rounded-xl rounded-tl-none shadow-xs border border-surface-container-high flex flex-col gap-2 text-[12px]">
                        <div className="flex items-center gap-1.5 text-primary border-b border-surface-container-high pb-1.5 font-bold">
                          <span className="material-symbols-outlined text-base">shield_lock</span>
                          <span>Pemberitahuan Resmi Perpustakaan</span>
                        </div>
                        <p className="leading-relaxed">
                          Halo <strong className="text-primary">{member.name}</strong> (NIS:{' '}
                          <span className="font-mono font-semibold">
                            {member.nisNisn} / {member.className}
                          </span>
                          ),
                        </p>
                        <p className="leading-relaxed">
                          Kartu perpustakaan Anda telah berhasil{' '}
                          <strong className="text-error">DIBLOKIR</strong> atas laporan{' '}
                          <em>&lsquo;{member.blockReason || blockReason}&rsquo;</em>. Semua akses
                          peminjaman &amp; pintu gerbang RFID saat ini dinonaktifkan demi keamanan.
                        </p>
                        <p className="leading-relaxed">
                          Silakan temui petugas di ruang perpustakaan untuk penerbitan kartu fisik
                          baru (SmartPass). Info lebih lanjut:{' '}
                          <span className="text-primary underline">
                            https://perpustakaan.smkmuhpakem.sch.id
                          </span>
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[11px] text-on-surface-variant">
                          <span className="font-mono">14:45</span>
                          <span className="font-bold text-primary">✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col rounded-xl border border-surface-container-high overflow-hidden bg-surface-container-lowest">
                    <div className="bg-surface-container-low p-3 border-b border-surface-container-high flex flex-col gap-1 text-[12px]">
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span>
                          <strong className="text-on-surface">Dari:</strong> Perpustakaan{' '}
                          {settings.schoolName} &lt;noreply@smkmuhpakem.sch.id&gt;
                        </span>
                        <span className="font-mono text-[11px]">24 Okt 2023, 14:45</span>
                      </div>
                      <div className="text-on-surface-variant">
                        <strong className="text-on-surface">Kepada:</strong> {member.name} &lt;
                        {member.email}&gt;
                      </div>
                      <div className="font-semibold text-on-surface mt-0.5">
                        <span className="text-error">[PENTING]</span> Konfirmasi Pengamanan Akun &amp;
                        Pemblokiran Kartu Anggota Perpustakaan
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
                        <div className="flex items-center gap-2">
                          <SafeImage
                            src={ASSETS.schoolCrest}
                            alt="Logo"
                            className="w-7 h-7 object-contain"
                            fallbackIcon="school"
                          />
                          <span className="text-[13px] font-bold text-primary">
                            Sistem Sirkulasi Otomasi Perpustakaan
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-error-container text-error text-[10px] font-bold">
                          STATUS: BLOCKED
                        </span>
                      </div>

                      <div className="bg-surface-container-low p-3 rounded-lg grid grid-cols-2 gap-2 text-[12px]">
                        <div>
                          <span className="text-on-surface-variant text-[10px] block">
                            Alasan Pemblokiran
                          </span>
                          <span className="font-medium text-on-surface">
                            {member.blockReason || blockReason}
                          </span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-[10px] block">
                            Petugas Pelaksana
                          </span>
                          <span className="font-medium text-on-surface">
                            {settings.librarianName} (Pustakawan)
                          </span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-[10px] block">
                            Nomor Anggota
                          </span>
                          <span className="font-mono font-semibold text-primary">
                            {member.id} ({member.name})
                          </span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-[10px] block">
                            Buku Dipinjam Saat Ini
                          </span>
                          <span className="font-medium text-on-surface">
                            {activeLoans.length} Eksemplar (Aman di database)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Log Audit Transmisi Gateway */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface uppercase">
                    Log Audit Transmisi Gateway
                  </span>
                  <span className="font-mono text-[11px] text-tertiary-container font-semibold">
                    HTTP 200 OK · All Synced
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-surface-container-lowest flex items-center justify-between border border-surface-container-high">
                    <span className="text-on-surface-variant">WA Gateway API</span>
                    <span className="text-tertiary-container font-semibold">SENT (214ms)</span>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest flex items-center justify-between border border-surface-container-high">
                    <span className="text-on-surface-variant">SMTP Mailer</span>
                    <span className="text-tertiary-container font-semibold">DELIVERED</span>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest flex items-center justify-between border border-surface-container-high">
                    <span className="text-on-surface-variant">RFID Gate Cloud</span>
                    <span className="text-error font-semibold">DENIED_TOKEN</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    showToast('Notifikasi WhatsApp & Email berhasil dikirim ulang.', 'success')
                  }
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-surface-container-high text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-primary">send</span>
                  <span>Kirim Ulang Notifikasi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Menyiapkan berkas cetak Berita Acara Pemblokiran...', 'info');
                    window.print();
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-surface-container-high text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">description</span>
                  <span>Cetak Berita Acara</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBlockSuccessOpen(false);
                  showToast(`Kartu ${member.name} berstatus DIBLOKIR.`, 'warning');
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-[13px] font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Selesai &amp; Tutup Dialog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

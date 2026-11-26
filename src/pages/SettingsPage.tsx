import React, { useEffect, useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { formatRupiah } from '../data/libraryData';
import { LibrarySettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetDemoData, navigate } = useLibrary();
  const [form, setForm] = useState<LibrarySettings>(settings);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...form,
      maxLoansPerMember: Math.max(1, Math.min(10, Number(form.maxLoansPerMember) || 3)),
      defaultLoanDays: Math.max(1, Math.min(30, Number(form.defaultLoanDays) || 7)),
      finePerDay: Math.max(0, Number(form.finePerDay) || 0),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">settings</span>
            <span>Konfigurasi Kebijakan &amp; Identitas</span>
          </div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold text-on-surface tracking-tight mt-1">
            Pengaturan Sistem Perpustakaan
          </h1>
          <p className="text-[13px] text-on-surface-variant mt-1">
            Atur batas kuota pinjaman, tarif denda keterlambatan, dan informasi resmi yang tampil pada struk serta kartu digital.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('circulation')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] font-semibold border border-outline-variant/40 hover:bg-surface-container-high transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-base text-primary">arrow_back</span>
          <span>Kembali ke Sirkulasi</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas Instansi */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-container">
            <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Identitas Sekolah &amp; Unit Perpustakaan
              </h2>
              <p className="text-xs text-on-surface-variant">
                Informasi ini otomatis dicetak di kop struk pengembalian dan kartu anggota digital.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Nama Sekolah / Instansi
              </label>
              <input
                type="text"
                required
                value={form.schoolName}
                onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Nama Unit Perpustakaan
              </label>
              <input
                type="text"
                required
                value={form.libraryUnit}
                onChange={(e) => setForm({ ...form, libraryUnit: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Alamat Lengkap
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Nomor Telepon Layanan
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Email Resmi Perpustakaan
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Jam Operasional Layanan
              </label>
              <input
                type="text"
                value={form.operatingHours}
                onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* Kebijakan Sirkulasi & Denda */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-container">
            <div className="w-9 h-9 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined">gavel</span>
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Aturan Sirkulasi &amp; Tarif Denda Keterlambatan
              </h2>
              <p className="text-xs text-on-surface-variant">
                Berlaku langsung pada mesin validasi meja sirkulasi dan perhitungan kwitansi pengembalian.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Maksimal Pinjaman per Anggota (Buku)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.maxLoansPerMember}
                onChange={(e) =>
                  setForm({ ...form, maxLoansPerMember: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Durasi Pinjam Standar (Hari)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={form.defaultLoanDays}
                onChange={(e) =>
                  setForm({ ...form, defaultLoanDays: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Tarif Denda Harian (Rp / Hari)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={form.finePerDay}
                onChange={(e) => setForm({ ...form, finePerDay: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-on-surface-variant">
              Simulasi Denda Keterlambatan 3 Hari:
            </span>
            <span className="font-mono font-bold text-primary text-sm tabular-nums">
              3 hari × {formatRupiah(Number(form.finePerDay) || 0)} ={' '}
              {formatRupiah(3 * (Number(form.finePerDay) || 0))}
            </span>
          </div>
        </section>

        {/* Pejabat & Pustakawan */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-container">
            <div className="w-9 h-9 rounded-lg bg-tertiary-fixed text-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Petugas Meja Sirkulasi &amp; Pengesahan Kartu
              </h2>
              <p className="text-xs text-on-surface-variant">
                Nama petugas tercetak pada setiap struk transaksi dan tanda tangan digital kartu anggota.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Pustakawan Bertugas
              </label>
              <input
                type="text"
                required
                value={form.librarianName}
                onChange={(e) => setForm({ ...form, librarianName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Kepala Perpustakaan
              </label>
              <input
                type="text"
                required
                value={form.headLibrarianName}
                onChange={(e) => setForm({ ...form, headLibrarianName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                NIP / NBM Kepala Perpustakaan
              </label>
              <input
                type="text"
                value={form.headLibrarianNip}
                onChange={(e) => setForm({ ...form, headLibrarianNip: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* Save & Reset Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-error-container/60 text-error text-xs font-semibold hover:bg-error-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              <span>Reset Data Simulasi</span>
            </button>
            <span className="text-xs text-on-surface-variant">
              Kembalikan katalog, anggota, dan transaksi ke data awal.
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {isDirty && (
              <button
                type="button"
                onClick={() => setForm(settings)}
                className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Batalkan Perubahan
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>
      </form>

      {/* Inline Confirm Reset Modal */}
      {confirmResetOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmResetOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-outline-variant/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Reset Seluruh Data Simulasi?
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Semua perubahan transaksi peminjaman, buku baru, status blokir kartu, dan pengaturan kustom akan dikembalikan ke data awal SMK Muhammadiyah Pakem.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-error text-on-error text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Ya, Reset Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

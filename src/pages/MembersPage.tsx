import React, { useMemo, useState } from 'react';
import { SafeImage } from '../components/SafeImage';
import { useLibrary } from '../context/LibraryContext';
import { MemberRole } from '../types';

export const MembersPage: React.FC = () => {
  const { members, transactions, settings, addMember, navigate } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New Member form
  const [name, setName] = useState('');
  const [nisNisn, setNisNisn] = useState('');
  const [role, setRole] = useState<MemberRole>('Siswa Reguler');
  const [department, setDepartment] = useState('Rekayasa Perangkat Lunak (RPL)');
  const [className, setClassName] = useState('X RPL 1');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+62 812-');

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (statusFilter === 'active' && m.cardBlocked) return false;
      if (statusFilter === 'blocked' && !m.cardBlocked) return false;
      if (q) {
        const hay = `${m.id} ${m.name} ${m.nisNisn} ${m.department} ${m.className}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const created = addMember({
      nisNisn: nisNisn.trim() || '2023-0900 / 0079001122',
      name: name.trim(),
      role,
      department: department.trim(),
      className: className.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@smkmuhpakem.sch.id`,
      phone: phone.trim(),
      joinedDate: '24 Okt 2023',
      validUntil: '30 Juni 2026',
      photoUrl: '',
      cardPhotoUrl: '',
      cardBlocked: false,
    });
    setAddModalOpen(false);
    setName('');
    setNisNisn('');
    setEmail('');
    navigate('member-detail', { memberId: created.id });
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
            <span>Keanggotaan</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-semibold">Direktori Anggota Perpustakaan</span>
          </div>
          <h1 className="font-display text-[28px] leading-[36px] font-bold text-primary tracking-tight mt-1">
            Daftar Anggota &amp; SmartPass Siswa
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-0.5">
            Kelola data siswa, pengajar, kuota pinjam, riwayat sirkulasi, dan kartu anggota digital {settings.schoolName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold shadow-sm hover:bg-primary-container transition-all whitespace-nowrap cursor-pointer self-start lg:self-auto"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>Daftarkan Anggota Baru</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-5">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa, ID Anggota (ANG-0842), NIS, atau jurusan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-[13px] placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-[13px] focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Kategori Anggota</option>
            <option value="Siswa Reguler">Siswa Reguler</option>
            <option value="Pengajar">Pengajar</option>
            <option value="Peneliti Tamu">Peneliti Tamu</option>
          </select>

          <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-1">
            {(['all', 'active', 'blocked'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {st === 'all' ? 'Semua' : st === 'active' ? 'Aktif' : 'Diblokir'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const activeLoansCount = transactions.filter(
            (t) => t.memberId === member.id && t.status !== 'returned'
          ).length;
          const totalLoansCount = transactions.filter((t) => t.memberId === member.id).length;

          return (
            <div
              key={member.id}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <SafeImage
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    fallbackText={member.initials}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-[15px] font-bold text-on-surface truncate">
                        {member.name}
                      </h3>
                    </div>
                    <p className="font-mono text-[11px] text-primary font-semibold">{member.id}</p>
                    <p className="text-[12px] text-on-surface-variant truncate">
                      {member.role} · {member.className}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                    member.cardBlocked
                      ? 'bg-error-container text-error'
                      : 'bg-tertiary-fixed text-tertiary-container'
                  }`}
                >
                  {member.cardBlocked ? 'Kartu Diblokir' : 'Aktif'}
                </span>
              </div>

              <div className="bg-surface-container-low rounded-lg p-3 space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Jurusan / Unit</span>
                  <span className="font-semibold text-on-surface truncate max-w-[180px]">
                    {member.department}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Kuota Pinjam Aktif</span>
                  <span className="font-mono font-bold text-primary tabular-nums">
                    {activeLoansCount} / {settings.maxLoansPerMember} Buku
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      activeLoansCount >= settings.maxLoansPerMember
                        ? 'bg-error'
                        : 'bg-primary-container'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (activeLoansCount / settings.maxLoansPerMember) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-outline pt-0.5">
                  <span>Total Riwayat: {totalLoansCount} Transaksi</span>
                  <span>Kepatuhan: {member.complianceRate}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigate('member-detail', { memberId: member.id })}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-container text-primary text-[12px] font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">history</span>
                  <span>Detail Riwayat</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('member-card', { memberId: member.id })}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-on-primary text-[12px] font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>Kartu Digital</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <h2 className="font-display text-lg font-bold text-on-surface">
                Daftarkan Anggota Baru
              </h2>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Raka Pratama"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">NIS / NISN</label>
                  <input
                    type="text"
                    value={nisNisn}
                    onChange={(e) => setNisNisn(e.target.value)}
                    placeholder="2023-0912 / 007..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Peran / Kategori</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as MemberRole)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                  >
                    <option value="Siswa Reguler">Siswa Reguler</option>
                    <option value="Pengajar">Pengajar</option>
                    <option value="Peneliti Tamu">Peneliti Tamu</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Kompetensi Keahlian</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Kelas</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Email Sekolah</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@smkmuhpakem.sch.id"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-[13px] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

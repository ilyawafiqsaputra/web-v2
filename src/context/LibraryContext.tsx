import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_BOOKS,
  INITIAL_MEMBERS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
} from '../data/libraryData';
import {
  Book,
  CardBlockReason,
  CirculationTransaction,
  LibrarySettings,
  Member,
  PageRoute,
  ToastItem,
} from '../types';

interface LibraryContextValue {
  route: PageRoute;
  navigate: (route: PageRoute, opts?: { memberId?: string; transactionId?: string; loanBookId?: string; loanMemberId?: string }) => void;
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  selectedTransactionId: string;
  setSelectedTransactionId: (id: string) => void;
  preselectedBookIdForLoan: string | null;
  setPreselectedBookIdForLoan: (id: string | null) => void;
  preselectedMemberIdForLoan: string | null;
  setPreselectedMemberIdForLoan: (id: string | null) => void;

  books: Book[];
  members: Member[];
  transactions: CirculationTransaction[];
  settings: LibrarySettings;
  toasts: ToastItem[];

  showToast: (message: string, type?: ToastItem['type']) => void;
  dismissToast: (id: string) => void;

  addBook: (book: Omit<Book, 'id'>) => Book;
  updateBook: (id: string, updates: Partial<Book>) => void;
  reserveBookWaitlist: (bookId: string, memberId: string) => void;

  addMember: (member: Omit<Member, 'id' | 'initials' | 'qrTokenHash' | 'complianceRate' | 'lastGateActivity'>) => Member;
  updateMember: (id: string, updates: Partial<Member>) => void;
  regenerateQrToken: (memberId: string) => string;
  blockMemberCard: (memberId: string, reason: CardBlockReason, note: string) => Member | null;
  unblockMemberCard: (memberId: string) => void;

  createLoan: (params: {
    memberId: string;
    bookId: string;
    durationDays: number;
    notes?: string;
  }) => { ok: true; transaction: CirculationTransaction } | { ok: false; error: string };

  processReturn: (transactionId: string, conditionNote?: string) => CirculationTransaction | null;
  extendLoan: (transactionId: string, extraDays?: number) => void;

  updateSettings: (updates: Partial<LibrarySettings>) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = 'smk_pakem_sipus_v1';

const LibraryContext = createContext<LibraryContextValue | null>(null);

function generateHash(): string {
  const seg = () => Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase().padStart(4, '0');
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadSaved = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore storage errors
    }
    return null;
  };

  const saved = loadSaved();

  const [route, setRoute] = useState<PageRoute>('circulation');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('ANG-0842');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('TR-2023-1878');
  const [preselectedBookIdForLoan, setPreselectedBookIdForLoan] = useState<string | null>(null);
  const [preselectedMemberIdForLoan, setPreselectedMemberIdForLoan] = useState<string | null>(null);

  const [books, setBooks] = useState<Book[]>(saved?.books || INITIAL_BOOKS);
  const [members, setMembers] = useState<Member[]>(saved?.members || INITIAL_MEMBERS);
  const [transactions, setTransactions] = useState<CirculationTransaction[]>(
    saved?.transactions || INITIAL_TRANSACTIONS
  );
  const [settings, setSettings] = useState<LibrarySettings>(saved?.settings || INITIAL_SETTINGS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ books, members, transactions, settings }));
    } catch {
      // ignore quota errors
    }
  }, [books, members, transactions, settings]);

  const showToast = (message: string, type: ToastItem['type'] = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigate: LibraryContextValue['navigate'] = (nextRoute, opts) => {
    if (opts?.memberId) setSelectedMemberId(opts.memberId);
    if (opts?.transactionId) setSelectedTransactionId(opts.transactionId);
    if (opts?.loanBookId !== undefined) setPreselectedBookIdForLoan(opts.loanBookId);
    if (opts?.loanMemberId !== undefined) setPreselectedMemberIdForLoan(opts.loanMemberId);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addBook = (bookInput: Omit<Book, 'id'>): Book => {
    const maxNum = books.reduce((max, b) => {
      const n = parseInt(b.id.replace('BK-', ''), 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const nextId = `BK-${String(maxNum + 1).padStart(3, '0')}`;
    const created: Book = { ...bookInput, id: nextId };
    setBooks((prev) => [created, ...prev]);
    showToast(`Buku "${created.title}" (${created.id}) berhasil ditambahkan ke katalog.`, 'success');
    return created;
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    showToast(`Data koleksi ${id} berhasil diperbarui.`, 'success');
  };

  const reserveBookWaitlist = (bookId: string, memberId: string) => {
    const book = books.find((b) => b.id === bookId);
    const member = members.find((m) => m.id === memberId);
    if (!book || !member) return;
    const currentList = book.waitlistMemberIds || [];
    if (currentList.includes(memberId)) {
      showToast(`${member.name} sudah terdaftar di antrean reservasi "${book.title}".`, 'info');
      return;
    }
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId ? { ...b, waitlistMemberIds: [...(b.waitlistMemberIds || []), memberId] } : b
      )
    );
    showToast(`Reservasi antrean dicatat untuk ${member.name} pada buku "${book.title}".`, 'success');
  };

  const addMember = (
    input: Omit<Member, 'id' | 'initials' | 'qrTokenHash' | 'complianceRate' | 'lastGateActivity'>
  ): Member => {
    const maxNum = members.reduce((max, m) => {
      const n = parseInt(m.id.replace('ANG-', ''), 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 842);
    const nextId = `ANG-${String(maxNum + 1).padStart(4, '0')}`;
    const initials = input.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
    const created: Member = {
      ...input,
      id: nextId,
      initials: initials || 'AG',
      qrTokenHash: generateHash(),
      complianceRate: 100,
      lastGateActivity: 'Baru terdaftar',
    };
    setMembers((prev) => [created, ...prev]);
    showToast(`Anggota baru ${created.name} (${created.id}) berhasil didaftarkan.`, 'success');
    return created;
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    showToast(`Profil anggota ${id} berhasil diperbarui.`, 'success');
  };

  const regenerateQrToken = (memberId: string): string => {
    const newHash = generateHash();
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, qrTokenHash: newHash } : m)));
    showToast(`Token QR dinamis diperbarui dengan Hash HMAC-256 baru (${newHash}).`, 'success');
    return newHash;
  };

  const blockMemberCard = (memberId: string, reason: CardBlockReason, note: string): Member | null => {
    const now = new Date();
    const timeStr = `24 Okt 2023, ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} WIB`;
    const refId = `#BLK-2023-${memberId.replace('ANG-', '')}`;
    let updated: Member | null = null;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          updated = {
            ...m,
            cardBlocked: true,
            blockReason: reason,
            blockNote: note,
            blockedAt: timeStr,
            blockRefId: refId,
          };
          return updated;
        }
        return m;
      })
    );
    return updated;
  };

  const unblockMemberCard = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              cardBlocked: false,
              blockReason: undefined,
              blockNote: undefined,
              blockedAt: undefined,
              blockRefId: undefined,
            }
          : m
      )
    );
    showToast('Kartu anggota berhasil diaktifkan kembali. Hak akses sirkulasi normal.', 'success');
  };

  const createLoan: LibraryContextValue['createLoan'] = ({ memberId, bookId, durationDays, notes }) => {
    const member = members.find((m) => m.id === memberId);
    const book = books.find((b) => b.id === bookId);
    if (!member) return { ok: false, error: 'Anggota tidak ditemukan.' };
    if (member.cardBlocked) {
      return {
        ok: false,
        error: `Kartu anggota ${member.name} (${member.id}) sedang DIBLOKIR. Aktifkan kartu terlebih dahulu.`,
      };
    }
    const activeLoansCount = transactions.filter(
      (t) => t.memberId === memberId && t.status !== 'returned'
    ).length;
    if (activeLoansCount >= settings.maxLoansPerMember) {
      return {
        ok: false,
        error: `Kuota pinjam ${member.name} sudah penuh (${activeLoansCount}/${settings.maxLoansPerMember} buku).`,
      };
    }
    if (!book) return { ok: false, error: 'Buku tidak ditemukan di katalog.' };
    if (book.availableStock <= 0) {
      return {
        ok: false,
        error: `Stok fisik "${book.title}" (${book.id}) habis (0 unit). Peminjaman ditolak sistem.`,
      };
    }

    const maxTx = transactions.reduce((max, t) => {
      const parts = t.id.split('-');
      const num = parseInt(parts[2] || '1090', 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 1092);
    const nextTxId = `TR-2023-${maxTx + 1}`;
    const refNum = 88920 + Math.floor(Math.random() * 800);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const baseDate = new Date(2023, 9, 24); // 24 Okt 2023 matching design baseline
    const dueDateObj = new Date(baseDate);
    dueDateObj.setDate(baseDate.getDate() + durationDays);

    const fmtDisplay = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    const fmtISO = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const newTx: CirculationTransaction = {
      id: nextTxId,
      refCode: `BAR-${refNum}`,
      memberId: member.id,
      bookId: book.id,
      borrowDate: fmtDisplay(baseDate),
      borrowDateISO: fmtISO(baseDate),
      dueDate: fmtDisplay(dueDateObj),
      dueDateISO: fmtISO(dueDateObj),
      durationDays,
      overdueDays: 0,
      fineAmount: 0,
      finePaid: false,
      status: 'active',
      librarianName: settings.librarianName,
      notes: notes || undefined,
    };

    setBooks((prev) =>
      prev.map((b) =>
        b.id === book.id ? { ...b, availableStock: Math.max(0, b.availableStock - 1) } : b
      )
    );
    setTransactions((prev) => [newTx, ...prev]);
    return { ok: true, transaction: newTx };
  };

  const processReturn = (transactionId: string, conditionNote?: string): CirculationTransaction | null => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.status === 'returned') return null;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}:${String(now.getSeconds()).padStart(2, '0')}`;
    const fineAmount = tx.overdueDays * settings.finePerDay;
    const receiptNo = `STR-2023-1024-${String(Math.floor(100 + Math.random() * 899))}`;

    const completedTx: CirculationTransaction = {
      ...tx,
      status: 'returned',
      returnDate: '24 Okt 2023',
      returnTime: timeStr,
      fineAmount,
      finePaid: true,
      receiptNumber: receiptNo,
      conditionCheck:
        conditionNote ||
        'Pemeriksaan segel barcode RFID lolos uji sensor gerbang masuk. Kondisi fisik buku baik & halaman lengkap.',
    };

    setTransactions((prev) => prev.map((t) => (t.id === transactionId ? completedTx : t)));
    setBooks((prev) =>
      prev.map((b) =>
        b.id === tx.bookId
          ? { ...b, availableStock: Math.min(b.totalStock, b.availableStock + 1) }
          : b
      )
    );
    const bookTitle = books.find((b) => b.id === tx.bookId)?.title || tx.bookId;
    showToast(
      `Pengembalian ${tx.id} berhasil! Stok "${bookTitle}" dipulihkan (+1 unit).`,
      'success'
    );
    return completedTx;
  };

  const extendLoan = (transactionId: string, extraDays = 7) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.status === 'returned') return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const [y, m, d] = tx.dueDateISO.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + extraDays);

    const newDueDisplay = `${String(dt.getDate()).padStart(2, '0')} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
    const newDueISO = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
      dt.getDate()
    ).padStart(2, '0')}`;

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              dueDate: newDueDisplay,
              dueDateISO: newDueISO,
              durationDays: t.durationDays + extraDays,
              overdueDays: 0,
              fineAmount: 0,
              status: 'active',
            }
          : t
      )
    );
    showToast(`Masa pinjam ${transactionId} diperpanjang +${extraDays} hari hingga ${newDueDisplay}.`, 'success');
  };

  const updateSettings = (updates: Partial<LibrarySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    showToast('Pengaturan sistem perpustakaan berhasil disimpan.', 'success');
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setBooks(INITIAL_BOOKS);
    setMembers(INITIAL_MEMBERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setSettings(INITIAL_SETTINGS);
    showToast('Seluruh data simulasi perpustakaan dikembalikan ke kondisi awal.', 'info');
  };

  return (
    <LibraryContext.Provider
      value={{
        route,
        navigate,
        selectedMemberId,
        setSelectedMemberId,
        selectedTransactionId,
        setSelectedTransactionId,
        preselectedBookIdForLoan,
        setPreselectedBookIdForLoan,
        preselectedMemberIdForLoan,
        setPreselectedMemberIdForLoan,
        books,
        members,
        transactions,
        settings,
        toasts,
        showToast,
        dismissToast,
        addBook,
        updateBook,
        reserveBookWaitlist,
        addMember,
        updateMember,
        regenerateQrToken,
        blockMemberCard,
        unblockMemberCard,
        createLoan,
        processReturn,
        extendLoan,
        updateSettings,
        resetDemoData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}

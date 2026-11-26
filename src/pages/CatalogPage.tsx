import React, { useMemo, useState } from 'react';
import { SafeImage } from '../components/SafeImage';
import { useLibrary } from '../context/LibraryContext';
import { Book, BookCategory } from '../types';

const CATEGORIES: BookCategory[] = [
  'Sastra & Fiksi',
  'Teknologi & Komputer',
  'Sains & Pengetahuan',
  'Sejarah & Budaya',
  'Pengembangan Diri & Bisnis',
];

export const CatalogPage: React.FC = () => {
  const {
    books,
    members,
    transactions,
    addBook,
    updateBook,
    reserveBookWaitlist,
    navigate,
    showToast,
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('id-asc');
  const [stockTab, setStockTab] = useState<'all' | 'available' | 'outofstock'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [logBook, setLogBook] = useState<Book | null>(null);

  // Add/Edit Form state
  const [formTitle, setFormTitle] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState<BookCategory>('Teknologi & Komputer');
  const [formPublisher, setFormPublisher] = useState('');
  const [formYear, setFormYear] = useState(2023);
  const [formStock, setFormStock] = useState(5);
  const [formShelf, setFormShelf] = useState('');
  const [formDdc, setFormDdc] = useState('');

  const nextAutoId = useMemo(() => {
    const maxNum = books.reduce((max, b) => {
      const n = parseInt(b.id.replace('BK-', ''), 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);
    return `BK-${String(maxNum + 1).padStart(3, '0')}`;
  }, [books]);

  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((s, b) => s + b.totalStock, 0);
    const availableCopies = books.reduce((s, b) => s + b.availableStock, 0);
    const borrowedCopies = totalCopies - availableCopies;
    const outOrLowCount = books.filter((b) => b.availableStock <= 1).length;
    const availableTitles = books.filter((b) => b.availableStock > 0).length;
    const outOfStockTitles = books.filter((b) => b.availableStock === 0).length;
    const lendingRate = totalCopies > 0 ? ((borrowedCopies / totalCopies) * 100).toFixed(1) : '0.0';
    return {
      totalTitles,
      totalCopies,
      borrowedCopies,
      outOrLowCount,
      availableTitles,
      outOfStockTitles,
      lendingRate,
    };
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = books.filter((b) => {
      if (stockTab === 'available' && b.availableStock <= 0) return false;
      if (stockTab === 'outofstock' && b.availableStock > 0) return false;
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      if (q) {
        const hay = `${b.id} ${b.title} ${b.author} ${b.isbn} ${b.publisher}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'id-asc') return a.id.localeCompare(b.id);
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'stock-desc') return b.availableStock - a.availableStock;
      if (sortBy === 'stock-asc') return a.availableStock - b.availableStock;
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [books, searchQuery, categoryFilter, sortBy, stockTab]);

  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormIsbn('');
    setFormAuthor('');
    setFormCategory('Teknologi & Komputer');
    setFormPublisher('');
    setFormYear(2023);
    setFormStock(5);
    setFormShelf('Rak T-05 (Lantai 2)');
    setFormDdc('005.133');
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setFormTitle(book.title);
    setFormIsbn(book.isbn);
    setFormAuthor(book.author);
    setFormCategory(book.category);
    setFormPublisher(book.publisher);
    setFormYear(book.year);
    setFormStock(book.totalStock);
    setFormShelf(book.shelfLocation);
    setFormDdc(book.ddcCode);
    setEditBook(book);
  };

  const handleSaveNewBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAuthor.trim()) return;
    addBook({
      isbn: formIsbn.trim() || '978-602-000-000-0',
      title: formTitle.trim(),
      author: formAuthor.trim(),
      publisher: formPublisher.trim() || 'Pustaka Edukasi',
      year: Number(formYear) || 2023,
      category: formCategory,
      shelfLocation: formShelf.trim() || 'Rak Umum (Lantai 1)',
      ddcCode: formDdc.trim() || '005.1',
      totalStock: Math.max(1, Number(formStock)),
      availableStock: Math.max(1, Number(formStock)),
      coverUrl: '',
    });
    setAddModalOpen(false);
  };

  const handleSaveEditBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBook) return;
    const borrowed = editBook.totalStock - editBook.availableStock;
    const newTotal = Math.max(borrowed, Number(formStock));
    updateBook(editBook.id, {
      title: formTitle.trim(),
      isbn: formIsbn.trim(),
      author: formAuthor.trim(),
      category: formCategory,
      publisher: formPublisher.trim(),
      year: Number(formYear),
      totalStock: newTotal,
      availableStock: Math.max(0, newTotal - borrowed),
      shelfLocation: formShelf.trim(),
      ddcCode: formDdc.trim(),
    });
    setEditBook(null);
  };

  const handleExportCsv = () => {
    const headers = ['ID Buku', 'Judul', 'Pengarang', 'Kategori', 'ISBN', 'Rak', 'Total Stok', 'Tersedia'];
    const rows = filteredBooks.map((b) => [
      b.id,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.author}"`,
      `"${b.category}"`,
      b.isbn,
      `"${b.shelfLocation}"`,
      b.totalStock,
      b.availableStock,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'katalog_perpustakaan_smk_pakem.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Katalog koleksi berhasil diekspor ke CSV.', 'success');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBooks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBooks.map((b) => b.id));
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
            <span>Katalog Sistem</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-semibold">Inventaris Koleksi Fisik</span>
          </div>
          <h1 className="font-display text-[28px] leading-[36px] font-bold text-primary tracking-tight mt-1">
            Katalog &amp; Inventaris Koleksi Buku
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-0.5">
            Kelola data koleksi buku perpustakaan, pantau stok real-time, dan perbarui data pustaka.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-[13px] font-semibold shadow-xs hover:bg-surface-container-high transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-on-surface-variant">
              file_download
            </span>
            <span>Export CSV/Excel</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold shadow-sm hover:bg-primary-container transition-all whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Tambah Buku Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Total Judul Koleksi
              </span>
              <span className="font-display text-[28px] font-bold text-on-surface mt-1 tabular-nums">
                {stats.totalTitles}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">auto_stories</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[12px] text-on-surface-variant">
            <span className="text-tertiary-container font-semibold bg-tertiary-fixed px-1.5 py-0.5 rounded">
              +12
            </span>
            <span>judul diarsipkan semester ini</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Total Eksemplar Fisik
              </span>
              <span className="font-display text-[28px] font-bold text-on-surface mt-1 tabular-nums">
                {stats.totalCopies}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">shelves</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[12px] text-on-surface-variant">
            <span>Tersebar di 18 rak gedung A &amp; B</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Buku Sedang Dipinjam
              </span>
              <span className="font-display text-[28px] font-bold text-secondary mt-1 tabular-nums">
                {stats.borrowedCopies}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
              <span className="material-symbols-outlined text-xl">sync_saved_locally</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[12px] text-on-surface-variant">
            <span className="text-secondary font-semibold bg-secondary-fixed/50 px-1.5 py-0.5 rounded tabular-nums">
              {stats.lendingRate}% Aktif
            </span>
            <span>Rasio peminjaman stabil</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Stok Habis / Kritis
              </span>
              <span className="font-display text-[28px] font-bold text-error mt-1 tabular-nums">
                {stats.outOrLowCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined text-xl">warning</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[12px] text-error font-semibold">
            <span className="material-symbols-outlined text-xs">priority_high</span>
            <span>Butuh restok &amp; pengembalian</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari buku berdasarkan ID Buku (misal: BK-001), Judul, atau Penulis..."
              className="w-full pl-10 pr-24 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-[13px] placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-surface-container text-[11px] font-mono text-on-surface-variant">
                ID
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container text-[11px] font-mono text-on-surface-variant">
                ISBN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative min-w-[180px] flex-1 sm:flex-none">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">
                expand_more
              </span>
            </div>

            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
              >
                <option value="id-asc">Urutkan: ID Terurut (Asc)</option>
                <option value="year-desc">Urutkan: Terbaru Terbit</option>
                <option value="stock-desc">Urutkan: Stok Terbanyak</option>
                <option value="stock-asc">Urutkan: Stok Terkritis (0 - 1)</option>
                <option value="title-asc">Urutkan: Judul (A - Z)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">
                sort
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setSortBy('id-asc');
                setStockTab('all');
              }}
              className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Reset filter"
            >
              <span className="material-symbols-outlined text-lg">filter_alt_off</span>
            </button>
          </div>
        </div>

        {/* Segment Tabs */}
        <div className="flex items-center justify-between border-t border-surface-container pt-3 mt-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5" role="tablist">
            <button
              type="button"
              onClick={() => setStockTab('all')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                stockTab === 'all'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Semua Koleksi <span className="ml-1 opacity-80 font-mono">{stats.totalTitles}</span>
            </button>
            <button
              type="button"
              onClick={() => setStockTab('available')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                stockTab === 'available'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Tersedia (&gt;0){' '}
              <span className="ml-1 font-mono">{stats.availableTitles}</span>
            </button>
            <button
              type="button"
              onClick={() => setStockTab('outofstock')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                stockTab === 'outofstock'
                  ? 'bg-error text-on-error shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Stok Habis (0){' '}
              <span className="ml-1 font-mono">{stats.outOfStockTitles}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-on-surface-variant text-[12px]">
            <span className="material-symbols-outlined text-base">tune</span>
            <span>Katalog Terverifikasi Standar DDC &amp; ISO-2709</span>
          </div>
        </div>
      </div>

      {/* Book Inventory Data Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredBooks.length > 0 && selectedIds.length === filteredBooks.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">ID Buku</th>
                <th className="py-3.5 px-4 min-w-[280px]">Buku &amp; Metadata</th>
                <th className="py-3.5 px-4">Kategori &amp; Rak</th>
                <th className="py-3.5 px-4 text-center">Total Fisik</th>
                <th className="py-3.5 px-4 min-w-[160px]">Ketersediaan Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Pustaka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-[13px] text-on-surface">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    Tidak ada buku ditemukan untuk kata kunci atau filter tersebut.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const borrowed = book.totalStock - book.availableStock;
                  const pct =
                    book.totalStock > 0
                      ? Math.round((book.availableStock / book.totalStock) * 100)
                      : 0;
                  const isOut = book.availableStock === 0;
                  const isCritical = book.availableStock === 1;

                  return (
                    <tr
                      key={book.id}
                      className={`transition-colors group ${
                        isOut
                          ? 'bg-error-container/10 hover:bg-error-container/20'
                          : 'hover:bg-surface-container-low/70'
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(book.id)}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(book.id)
                                ? prev.filter((id) => id !== book.id)
                                : [...prev, book.id]
                            )
                          }
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded font-mono text-[12px] font-semibold ${
                            isOut
                              ? 'bg-error-container text-error'
                              : 'bg-surface-container text-primary'
                          }`}
                        >
                          {book.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={book.coverUrl}
                            alt={book.title}
                            className={`w-10 h-14 object-cover rounded shadow-xs flex-shrink-0 ${
                              isOut ? 'opacity-80 grayscale' : ''
                            }`}
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-bold text-on-surface group-hover:text-primary transition-colors truncate max-w-[260px]">
                                {book.title}
                              </span>
                              {book.isPopular && (
                                <span className="text-[10px] bg-error text-on-error font-semibold px-1.5 py-0.5 rounded">
                                  Populer
                                </span>
                              )}
                            </div>
                            <span className="text-[12px] text-on-surface-variant">{book.author}</span>
                            <span className="text-[11px] text-outline">
                              {book.publisher} · {book.year} · ISBN {book.isbn}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-on-surface">
                            {book.category}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-on-surface-variant mt-0.5">
                            <span className="material-symbols-outlined text-xs text-outline">
                              location_on
                            </span>
                            {book.shelfLocation}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold tabular-nums">
                        {book.totalStock} Eks
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[11px] tabular-nums">
                            <span
                              className={`font-semibold ${
                                isOut
                                  ? 'text-error'
                                  : isCritical
                                  ? 'text-secondary'
                                  : 'text-tertiary-container'
                              }`}
                            >
                              {book.availableStock} Tersedia
                            </span>
                            <span className="text-outline">{borrowed} Dipinjam</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOut
                                  ? 'bg-error'
                                  : isCritical
                                  ? 'bg-secondary-container'
                                  : 'bg-tertiary-container'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-error-container text-error whitespace-nowrap">
                            Stok Habis
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed whitespace-nowrap">
                            Sisa 1 (Kritis)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-tertiary-container whitespace-nowrap">
                            Tersedia
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {isOut ? (
                            <>
                              <button
                                type="button"
                                disabled
                                title="Buku sedang tidak tersedia"
                                className="px-2.5 py-1.5 bg-surface-container text-outline cursor-not-allowed text-[12px] font-semibold rounded flex items-center gap-1 opacity-70"
                              >
                                <span className="material-symbols-outlined text-sm">block</span>
                                <span>Pinjam</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => reserveBookWaitlist(book.id, 'ANG-0842')}
                                title="Reservasi Antrean"
                                className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">
                                  notification_add
                                </span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate('circulation', { loanBookId: book.id })
                                }
                                title="Pinjam Cepat"
                                className="px-2.5 py-1.5 bg-primary text-on-primary hover:bg-primary-container text-[12px] font-semibold rounded shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  bookmark_add
                                </span>
                                <span>Pinjam</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(book)}
                                title="Edit Data"
                                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setLogBook(book)}
                            title="Detail / Log Sirkulasi"
                            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">history</span>
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

        {/* Table Footer */}
        <div className="p-4 bg-surface-container-low/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-on-surface-variant">
          <span>
            Menampilkan <strong className="text-on-surface tabular-nums">{filteredBooks.length}</strong>{' '}
            dari <strong className="text-on-surface tabular-nums">{books.length}</strong> judul katalog
          </span>
          {selectedIds.length > 0 && (
            <span className="text-primary font-semibold">
              {selectedIds.length} koleksi dipilih
            </span>
          )}
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      {(addModalOpen || editBook) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/45 backdrop-blur-xs p-4"
          onClick={() => {
            setAddModalOpen(false);
            setEditBook(null);
          }}
        >
          <div
            className="bg-surface-container-lowest rounded-xl max-w-2xl w-full p-6 shadow-xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">
                    {editBook ? 'edit_note' : 'library_add'}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-[18px] text-on-surface font-bold">
                    {editBook ? `Edit Koleksi ${editBook.id}` : 'Tambah Buku Baru ke Katalog'}
                  </h2>
                  <p className="text-[12px] text-on-surface-variant">
                    Lengkapi metadata buku dan alokasikan stok inventaris fisik.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddModalOpen(false);
                  setEditBook(null);
                }}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form
              id="book-modal-form"
              onSubmit={editBook ? handleSaveEditBook : handleSaveNewBook}
              className="overflow-y-auto py-4 space-y-4 flex-1 pr-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    ID Buku (Otomatis)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={editBook ? editBook.id : nextAutoId}
                    className="w-full px-3 py-2 bg-surface-container-low text-primary font-mono text-[13px] font-bold rounded-lg cursor-not-allowed"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Nomor ISBN
                  </label>
                  <input
                    type="text"
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    placeholder="misal: 978-602-03-8822-1"
                    className="w-full px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">
                  Judul Buku Lengkap <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Masukkan judul buku beserta sub-judul bila ada..."
                  className="w-full px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Penulis / Pengarang <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Nama penulis / editor"
                    className="w-full px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Kategori Buku
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as BookCategory)}
                    className="w-full px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Penerbit &amp; Tahun Terbit
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={formPublisher}
                      onChange={(e) => setFormPublisher(e.target.value)}
                      placeholder="Nama Penerbit"
                      className="col-span-2 px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                    <input
                      type="number"
                      value={formYear}
                      onChange={(e) => setFormYear(Number(e.target.value))}
                      className="px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Total Stok Fisik <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] font-semibold rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">
                  Lokasi Rak &amp; Kode DDC
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formShelf}
                    onChange={(e) => setFormShelf(e.target.value)}
                    placeholder="misal: Rak T-05 (Lantai 2)"
                    className="px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                  <input
                    type="text"
                    value={formDdc}
                    onChange={(e) => setFormDdc(e.target.value)}
                    placeholder="Dewey Decimal (misal: 005.133)"
                    className="px-3 py-2 bg-surface-container-lowest text-on-surface text-[13px] rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>
            </form>

            <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddModalOpen(false);
                  setEditBook(null);
                }}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[13px] font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="book-modal-form"
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-[13px] font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>{editBook ? 'Perbarui Koleksi' : 'Simpan ke Katalog'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Circulation Log Modal */}
      {logBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/45 backdrop-blur-xs p-4"
          onClick={() => setLogBook(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{logBook.id}</span>
                <h3 className="font-display text-lg font-bold text-on-surface">{logBook.title}</h3>
                <p className="text-xs text-on-surface-variant">
                  {logBook.author} · DDC {logBook.ddcCode} · {logBook.shelfLocation}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLogBook(null)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-surface-container border border-surface-container rounded-xl">
              {transactions.filter((t) => t.bookId === logBook.id).length === 0 ? (
                <p className="p-4 text-xs text-center text-on-surface-variant">
                  Belum ada riwayat sirkulasi tercatat untuk judul ini.
                </p>
              ) : (
                transactions
                  .filter((t) => t.bookId === logBook.id)
                  .map((t) => {
                    const m = members.find((mem) => mem.id === t.memberId);
                    return (
                      <div key={t.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-primary">{t.id}</span>
                          <p className="font-semibold text-on-surface mt-0.5">
                            {m?.name} ({t.memberId})
                          </p>
                          <p className="text-on-surface-variant">
                            {t.borrowDate} → {t.returnDate || t.dueDate}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            t.status === 'returned'
                              ? 'bg-tertiary-fixed text-tertiary-container'
                              : t.status === 'overdue'
                              ? 'bg-error-container text-error'
                              : 'bg-primary-fixed text-primary'
                          }`}
                        >
                          {t.status === 'returned' ? 'Kembali' : 'Dipinjam'}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

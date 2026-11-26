export type PageRoute =
  | 'dashboard'
  | 'catalog'
  | 'circulation'
  | 'members'
  | 'member-detail'
  | 'member-card'
  | 'receipt'
  | 'settings';

export type BookCategory =
  | 'Sastra & Fiksi'
  | 'Teknologi & Komputer'
  | 'Sains & Pengetahuan'
  | 'Sejarah & Budaya'
  | 'Pengembangan Diri & Bisnis';

export interface Book {
  id: string; // e.g., BK-001
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: BookCategory;
  shelfLocation: string;
  ddcCode: string;
  totalStock: number;
  availableStock: number;
  coverUrl: string;
  isPopular?: boolean;
  waitlistMemberIds?: string[];
}

export type MemberRole = 'Siswa Reguler' | 'Pengajar' | 'Peneliti Tamu' | 'Mahasiswa';

export type CardBlockReason =
  | 'Kartu Fisik Hilang / Tercecer'
  | 'Kartu Rusak / Chip RFID Error'
  | 'Penyalahgunaan Akun oleh Orang Lain';

export interface Member {
  id: string; // e.g., ANG-0842
  nisNisn: string;
  name: string;
  initials: string;
  role: MemberRole;
  department: string; // e.g. Rekayasa Perangkat Lunak (RPL)
  className: string; // e.g. XII RPL 1
  email: string;
  phone: string;
  joinedDate: string;
  validUntil: string;
  photoUrl: string;
  cardPhotoUrl: string;
  cardBlocked: boolean;
  blockReason?: CardBlockReason;
  blockNote?: string;
  blockedAt?: string;
  blockRefId?: string;
  qrTokenHash: string;
  complianceRate: number;
  lastGateActivity: string;
}

export type TransactionStatus = 'active' | 'due_today' | 'overdue' | 'returned';

export interface CirculationTransaction {
  id: string; // e.g., TR-2023-1090
  refCode: string; // e.g., BAR-88912
  receiptNumber?: string; // e.g., STR-2023-1024-098
  memberId: string;
  bookId: string;
  borrowDate: string; // Display string e.g. "24 Okt 2023"
  borrowDateISO: string; // YYYY-MM-DD
  dueDate: string;
  dueDateISO: string;
  returnDate?: string;
  returnTime?: string;
  durationDays: number;
  overdueDays: number;
  fineAmount: number;
  finePaid: boolean;
  status: TransactionStatus;
  librarianName: string;
  notes?: string;
  conditionCheck?: string;
}

export interface LibrarySettings {
  schoolName: string;
  libraryUnit: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  maxLoansPerMember: number;
  defaultLoanDays: number;
  finePerDay: number;
  librarianName: string;
  headLibrarianName: string;
  headLibrarianNip: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

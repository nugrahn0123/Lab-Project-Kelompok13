export interface Event {
  id: number
  emoji: string
  gradient: string
  title: string
  artist: string
  date: string
  dateRaw: string
  venue: string
  city: string
  price: number
  seats: number
  totalSeats: number
  genre: string
  description: string
  isHot?: boolean
}

export interface MyTicket {
  id: string
  eventId: number
  event: Event
  quantity: number
  totalPrice: number
  status: 'aktif' | 'selesai' | 'dibatalkan'
  invoiceNo: string
  purchasedAt: string
  qrCode: string
}

export const events: Event[] = [
  {
    id: 1,
    emoji: '🎸',
    gradient: 'linear-gradient(135deg, #7c3aed, #db2777)',
    title: 'Dewa 19 Reunion Tour',
    artist: 'Dewa 19',
    date: '1 Sep 2026',
    dateRaw: '2026-09-01',
    venue: 'Gelora Bung Karno',
    city: 'Jakarta',
    price: 350000,
    seats: 420,
    totalSeats: 2000,
    genre: 'Rock',
    description:
      'Saksikan reunion tour legendaris Dewa 19 yang kembali hadir dengan semua personil asli. Rayakan 30 tahun perjalanan musik mereka dalam satu malam yang tak terlupakan di depan puluhan ribu penonton.',
    isHot: true,
  },
  {
    id: 2,
    emoji: '🎵',
    gradient: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
    title: 'Raisa Live in Makassar',
    artist: 'Raisa',
    date: '15 Sep 2026',
    dateRaw: '2026-09-15',
    venue: 'Lapangan Karebosi',
    city: 'Makassar',
    price: 250000,
    seats: 800,
    totalSeats: 3000,
    genre: 'Pop',
    description:
      'Raisa hadir spesial di Makassar membawakan hits-hits terbaiknya. Jangan lewatkan momen ini bersama ribuan penonton setia yang siap bernyanyi bersama sepanjang malam.',
    isHot: true,
  },
  {
    id: 3,
    emoji: '🎤',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    title: 'Tulus — Manusia Tour',
    artist: 'Tulus',
    date: '5 Okt 2026',
    dateRaw: '2026-10-05',
    venue: 'ICE BSD',
    city: 'Tangerang',
    price: 200000,
    seats: 12,
    totalSeats: 1500,
    genre: 'Jazz',
    description:
      'Tulus kembali hadir dengan tur solo-nya yang memukau. Nikmati suara emas Tulus membawakan lagu-lagu dari album Manusia secara live dalam suasana yang intim dan emosional.',
  },
  {
    id: 4,
    emoji: '🥁',
    gradient: 'linear-gradient(135deg, #22c55e, #0ea5e9)',
    title: 'Rock Fest Makassar 2026',
    artist: 'Various Artists',
    date: '20 Okt 2026',
    dateRaw: '2026-10-20',
    venue: 'Lapangan Hasanuddin',
    city: 'Makassar',
    price: 175000,
    seats: 1200,
    totalSeats: 5000,
    genre: 'Rock',
    description:
      'Festival rock terbesar di Sulawesi Selatan! Lineup yang memukau dari band-band rock terbaik Indonesia hadir dalam satu panggung epik yang tidak akan pernah kamu lupakan.',
  },
  {
    id: 5,
    emoji: '🎹',
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    title: "Maliq & D'Essentials",
    artist: "Maliq & D'Essentials",
    date: '1 Nov 2026',
    dateRaw: '2026-11-01',
    venue: 'Celebes Convention Center',
    city: 'Makassar',
    price: 300000,
    seats: 350,
    totalSeats: 1000,
    genre: 'R&B',
    description:
      "Maliq & D'Essentials hadir membawakan groove dan soul mereka ke Makassar. Bersiaplah untuk malam penuh nuansa R&B yang hangat, sensual, dan membekas di jiwa.",
    isHot: true,
  },
  {
    id: 6,
    emoji: '🎻',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    title: 'Payung Teduh Acoustic Night',
    artist: 'Payung Teduh',
    date: '15 Nov 2026',
    dateRaw: '2026-11-15',
    venue: 'Sudiang Cultural Center',
    city: 'Makassar',
    price: 150000,
    seats: 500,
    totalSeats: 800,
    genre: 'Folk',
    description:
      'Malam akustik yang intim bersama Payung Teduh. Rasakan kedekatan emosional lewat lagu-lagu mereka dalam format yang paling personal, di bawah langit Makassar yang indah.',
  },
  {
    id: 7,
    emoji: '🎧',
    gradient: 'linear-gradient(135deg, #f97316, #ec4899)',
    title: 'Nadin Amizah — Sendu Melagu',
    artist: 'Nadin Amizah',
    date: '5 Des 2026',
    dateRaw: '2026-12-05',
    venue: 'Trans Studio Makassar',
    city: 'Makassar',
    price: 225000,
    seats: 600,
    totalSeats: 2000,
    genre: 'Indie',
    description:
      'Nadin Amizah hadir dengan konser bertajuk "Sendu Melagu" — sebuah perjalanan musikal yang penuh emosi dan keindahan. Setiap nada adalah cerita, setiap lirik adalah perasaan.',
  },
  {
    id: 8,
    emoji: '🎺',
    gradient: 'linear-gradient(135deg, #a855f7, #6366f1)',
    title: 'Slank Big Gig Makassar',
    artist: 'Slank',
    date: '20 Des 2026',
    dateRaw: '2026-12-20',
    venue: 'GOR Mattoanging',
    city: 'Makassar',
    price: 125000,
    seats: 2000,
    totalSeats: 8000,
    genre: 'Rock',
    description:
      'Slank, band legendaris Indonesia, hadir kembali di Makassar! Bernyanyilah bersama ribuan Slankers dalam malam yang penuh energi, nostalgia, dan kehangatan persaudaraan.',
    isHot: true,
  },
]

export const myTickets: MyTicket[] = [
  {
    id: 'TKT-001',
    eventId: 1,
    event: events[0],
    quantity: 2,
    totalPrice: 710000,
    status: 'aktif',
    invoiceNo: 'INV-20260901-0001',
    purchasedAt: '25 Agu 2026',
    qrCode: 'QR-1-2-172939-ABC',
  },
  {
    id: 'TKT-002',
    eventId: 2,
    event: events[1],
    quantity: 1,
    totalPrice: 260000,
    status: 'aktif',
    invoiceNo: 'INV-20260915-0002',
    purchasedAt: '20 Agu 2026',
    qrCode: 'QR-2-1-172940-XYZ',
  },
  {
    id: 'TKT-003',
    eventId: 6,
    event: events[5],
    quantity: 2,
    totalPrice: 310000,
    status: 'selesai',
    invoiceNo: 'INV-20261115-0003',
    purchasedAt: '10 Nov 2025',
    qrCode: 'QR-6-2-172941-DEF',
  },
]

export function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString('id-ID')}`
}

export function getSeatsColor(seats: number, total: number): 'green' | 'yellow' | 'red' {
  const ratio = seats / total
  if (ratio > 0.3) return 'green'
  if (ratio > 0.05) return 'yellow'
  return 'red'
}

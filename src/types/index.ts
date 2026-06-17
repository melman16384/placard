export interface Room {
  id: string
  name: string
  capacity: number
  floor: string | null
  amenities: string[]
  description: string | null
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface Booking {
  id: string
  roomId: string
  userId: string
  title: string
  description: string | null
  startTime: Date
  endTime: Date
  createdAt: Date
  updatedAt: Date
  room?: Room
  user?: { id: string; name: string | null; email: string | null }
}

export interface Profile {
  id: string
  name: string | null
  email: string | null
  role: 'USER' | 'ADMIN'
}

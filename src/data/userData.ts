import { Role } from '@prisma/client'

export const userData = [
  {
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    password: '$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2',
    image: null,
    role: Role.superadmin,
    staffId: 1,
  },
  {
    name: 'ณัฐวุฒิ ขยันดี',
    email: 'nattawut@example.com',
    password: '$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2',
    image: null,
    role: Role.clerk,
    staffId: 2,
  },
  {
    name: 'ศิริพร วิริยะกิจ',
    email: 'siriporn@example.com',
    password: '$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2',
    image: null,
    role: Role.supervisor,
    staffId: 3,
  },
  {
    name: 'วัชรินทร์ แก่นแท้',
    email: 'watcharin@example.com',
    password: '$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2',
    image: null,
    role: Role.cutter,
    staffId: 4,
  },
  {
    name: 'กานต์พิชชา ส่งไว',
    email: 'kanpitcha@example.com',
    password: '$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2',
    image: null,
    role: Role.delivery,
    staffId: 5,
  },
]

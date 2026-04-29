import { Role } from "@prisma/client";

export const userData = [
  {
    name: "สมชาย ใจดี",
    email: "somchai@example.com",
    password: "$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2",
    image: null,
    role: Role.superadmin,
  },
  {
    name: "ณัฐวุฒิ ขยันดี",
    email: "nattawut@example.com",
    password: "$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2",
    image: null,
    role: Role.clerk,
  },
  {
    name: "ศิริพร วิริยะกิจ",
    email: "siriporn@example.com",
    password: "$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2",
    image: null,
    role: Role.supervisor,
  },
  {
    name: "วัชรินทร์ แก่นแท้",
    email: "watcharin@example.com",
    password: "$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2",
    image: null,
    role: Role.cutter,
  },
  {
    name: "กานต์พิชชา ส่งไว",
    email: "kanpitcha@example.com",
    password: "$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2",
    image: null,
    role: Role.delivery,
  },
  {
    name: "ธีราพัฒน์ จิรภาสนิธิเลิศ",
    email: "Teerapat@example.com",
    password: "$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2",
    image: null,
    role: Role.cutter,
  },
  {
    name: "วรเมธ โพธิ์ทอง",
    email: "voramate@example.com",
    password: "$2b$10$EGRpOe2jfYzlPhtMBh29euw9dXZOekrZBQsiilVKwk9p3nci9Eln2",
    image: null,
    role: Role.supervisor,
  },
];

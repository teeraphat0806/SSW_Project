import prisma from '@/lib/prisma'
import type { NextRequest } from 'next/server';
import bcrypt from 'bcrypt'


export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    const hashedPassword = bcrypt.hashSync(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'guest', 
      },
    })
    return Response.json({ message: 'User created', user })
  } catch (error) {
    return Response.json({ error:  `User could not be created because: ${error}`})
  }
}
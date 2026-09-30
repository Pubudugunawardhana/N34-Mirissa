'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function registerUser(
  prevState: any,
  formData: FormData,
) {
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to register.',
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { message: 'User with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If it's the first user, maybe make them an ADMIN for our testing purposes?
    // Let's just do it based on a hardcoded email or just make the first one ADMIN
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'CUSTOMER';

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role, // The first user gets ADMIN privileges
      },
    });

    return { success: true, message: 'Registration successful! You can now log in.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Create User.' };
  }
}

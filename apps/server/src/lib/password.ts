import bcrypt from 'bcryptjs'

const PASSWORD_SALT_ROUNDS = 10

export async function createPasswordHash(password: string): Promise<{ hashedPassword: string, salt: string }> {
  const salt = await bcrypt.genSalt(PASSWORD_SALT_ROUNDS)
  const hashedPassword = await bcrypt.hash(password, salt)

  return {
    hashedPassword,
    salt,
  }
}

export async function verifyPassword(password: string, hashedPassword: string, salt: string): Promise<boolean> {
  const hashedInputPassword = await bcrypt.hash(password, salt)
  return hashedInputPassword === hashedPassword
}

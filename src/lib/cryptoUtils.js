import bcrypt from 'bcrypt';

export async function hashPassword(password) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (err) {
    console.error('Hashing error:', err);
    throw new Error('Failed to hash password');
  }
}

export async function comparePassword(plainPassword, hashedPassword) {
  try {
    const result = await bcrypt.compare(plainPassword, hashedPassword);
    return result;
  } catch (err) {
    console.error('Password comparison error:', err);
    throw new Error('Failed to compare passwords');
  }
}
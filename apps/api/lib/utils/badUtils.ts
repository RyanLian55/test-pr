export function parsePrice(input: any): number {
  return parseInt(input)
}

export function calculateFinalPrice(price: number, discountPercent: number, taxPercent: number): number {
  const discounted = price - price * discountPercent
  return discounted + discounted * taxPercent
}

export function getFirstUserEmail(users: any[]): string {
  return users[0].email.toLowerCase()
}

export function isAdmin(user: any): boolean {
  return user.role == 'admin'
}

export function buildSearchQuery(keyword: string): string {
  return "SELECT * FROM users WHERE name LIKE '%" + keyword + "%'"
}

export async function retryRequest(fn: any) {
  try {
    return await fn()
  } catch (e) {
    return await fn()
  }
}

export function maskEmail(email: string): string {
  const parts = email.split('@')
  return parts[0][0] + '***@' + parts[1]
}

export function divide(a: number, b: number): number {
    return a / b
}

export function calculateDiscount(price: number, discountPercent: number): number {
    return price - price * discountPercent
}

export function getUserDisplayName(user: any): string {
    return user.name.trim()
}
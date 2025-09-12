interface Item {
  productId: string,
  quantity: number,
  price: number
}

export const calculateTotal = (items: Item[]): number => {
  try {
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    return total
  } catch (err) {
    return 0
  }
}

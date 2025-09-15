interface Item {
  productId: string
  quantity: number
  price: number
  productName: string

}

export const calculateTotalPrice = async (items: Item[]) => {
  return items.reduce((total, item) => {return total + (item.quantity * item.price)}, 0)
}

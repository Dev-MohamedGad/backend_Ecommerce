

import Cart from '../../../../DB/Models/cart.model.js'

export async function addCart(userId, product, quantity) {
    const cartObj = {
        userId,
        products: [
            {
                productId: product._id,
                quantity,
                basePrice: product.appliedPrice,
                title: product.title,
                finalPrice: product.appliedPrice * quantity,
            }
        ],
        subTotal: product.appliedPrice * quantity
    }

    const newCart = await Cart.create(cartObj)
    return newCart
}




export async function checkProductIfExistsInCart(cart, productId) {

    return cart.products.some(
        (product) => product.productId.toString() === productId
    )

}
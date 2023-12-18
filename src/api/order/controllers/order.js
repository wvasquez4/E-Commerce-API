'use strict';
const stripe = require('stripe')('sk_test_51OLGXiE9XEjgjBFGzdjwrM1ncYeHXuxnI0xoCCrRPusDoQymT5nlfEHVcwRise8EhLLSEMngYma8rmOe3sHw5RPE00T4X7iHVN');
/**
 * order controller
 */

function calcDiscountPrice(price, discount){
    if(!discount) return price;

    const discountAmount = (price * discount) / 100;
    const result = price - discountAmount;

    return result.toFixed(2);
}

const { createCoreController } = require('@strapi/strapi').factories;

// @ts-ignore
module.exports = createCoreController('api::order.order', ({ strapi }) => ({
    async paymentOrder(ctx) {
        const{ token, products, idUser } = ctx.request.body;

        let totalPayment = 0;
        products.array.forEach((product) => {
            const priceTemp = calcDiscountPrice(
                product.attributes.price,
                product.attributes.discount
            );

            totalPayment += Number(priceTemp)* product.quantity;
        });

        const charge = await stripe.charges.create({
            amount: Math.round(totalPayment * 100),
            currency: "usd",
            source: token.id,
            description: `User ID: ${idUser}`
        });

        const data = {
            products,
            user: idUser,
            totalPayment,
            idPayment: charge.id
        };

        const model = strapi.contentTypes["api::order.order"];
        const validData = await strapi.entityValidator.validateEntityCreation(model,data);

        const entry = await strapi.db.query("api::order.order").create({data: validData});

        return entry;
    },
})); 

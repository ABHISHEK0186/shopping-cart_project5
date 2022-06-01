const orderModel = require("../Models/orderModel");
const userModel = require('../Models/userModel');
const productModel = require("../Models/productModel");
const validator = require("../validator/validator");





const createOrder = async (req, res) => {
    try {
        const userId = req.params.userId;

        const data = req.body
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: 'Please provide request Body' }) }
        const { items, cancellable, totalItems, totalPrice, totalQuantity } = data
        const finalData = {}

        if (Object.keys(userId) == 0) return res.status(400).send({ status: false, message: 'Please provide user Id' })
        if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: 'Please provide a valid user Id' })

        const userMatch = await userModel.findOne({ _id: userId })
        if (!userMatch) return res.status(404).send({ status: false, message: `No user found with this id ${userId}` })

        //  CHECK : is product available

        for (let i = 0; i < items.length; i++) {

            if (!validator.isValid(items[i].productId)) return res.status(400).send({ status: false, message: `Please provide productId at position ${i + 1}` })
            if (!validator.isValidObjectId(items[i].productId)) return res.status(400).send({ status: false, message: `Please provide Valid productId at position ${i + 1}` })

            let isProductAvailable = await productModel.findOne({ _id: items[i].productId })
            if (!isProductAvailable) return res.status(404).send({ status: false, message: `Product doesn't Exist for ProductId ${items[i].productId} at position ${i + 1}` })
            if (!isProductAvailable.installments > 0) return res.status(404).send({ status: false, message: `Product with ProductId ${items[i].productId} at position ${i + 1} is OUT OF STOCK` })

            if (!items[i].quantity > 0) return res.status(400).send({ status: false, message: `Please provide min 1 quantity at position ${i + 1}` })

            const updateProductDetails = await productModel.findOneAndUpdate({ _id: items[i].productId }, { $inc: { installments:  - items[i].quantity } })

        }

        if (!validator.isValid(totalPrice)) return res.status(400).send({ status: false, message: 'Please provide total price' })

        if (!validator.isValid(totalQuantity)) return res.status(400).send({ status: false, message: 'Please provide total Quantity' })

        finalData["userId"] = userId
        finalData["items"] = items
        finalData["totalPrice"] = totalPrice
        finalData["totalItems"] = totalItems
        finalData["totalQuantity"] = totalQuantity
        finalData["status"] = "pending"
        finalData["deletedAt"] = ""
        finalData["isDeleted"] = false

        if (cancellable != null) finalData["cancellable"] = cancellable

        const order = await orderModel.create(finalData)
        return res.status(201).send({ status: true, message: "Order details", data: order })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const updateOrder = async (req, res) => {
    try {
        userId = req.params.userId;
        const dataForUpdates = req.body
        let finalUpdates = {}

        if (Object.keys(userId) == 0) { return res.status(400).send({ status: false, message: 'Please provide user Id' }) }

        if (Object.keys(dataForUpdates) == 0) { return res.status(400).send({ status: false, message: 'Please provide some data for update' }) }
        const { orderId, status } = dataForUpdates

        if (!validator.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: 'Please provide a valid user Id' }) }
        if (!validator.isValidObjectId(orderId)) { return res.status(400).send({ status: false, message: 'Please provide a valid orderId' }) }

        const userMatch = await userModel.findOne({ _id: userId })
        if (!userMatch) return res.status(404).send({ status: false, message: `No user found with this id ${userId}` })

        const orderMatch = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!orderMatch) return res.status(404).send({ status: false, message: `No order found with this id ${orderId}` })

        const isUsersOrder = await orderModel.findOne({ _id: orderId, userId: userId, isDeleted: false })
        if (!isUsersOrder) return res.status(400).send({ status: false, message: "Login User is not the owner of the order" })

        if (status == null) return res.status(400).send({ status: false, message: "Please Provide Order Status Update The Order" })

        if (status != null) {
            if (!validator.isValid(status)) return res.status(400).send({ status: false, message: "Please Provide Order Status" })
            if (!validator.isValidStatus(status)) return res.status(400).send({ status: false, message: "Please Provide Valid Order Status" })
            finalUpdates["status"] = status
        }
        if (status == "cancelled" || status == "Cancelled") {

            if (orderMatch.cancellable != true) {

                return res.status(400).send({ status: false, message: "Cannot Cancel This Order, Because It's Not A Cancellable Order" })
            }

            finalUpdates["isDeleted"] = isDeleted
            finalUpdates["deletedAt"] = new Date()

            const items = orderMatch.items
            for (let i = 0; i < items.length; i++) {
                const updateProductDetails = await productModel.findOneAndUpdate({ _id: items[i].productId }, { $inc: { installments:  items[i].quantity } })
            }


        }
        const order = await orderModel.findOneAndUpdate({ _id: orderId }, { ...finalUpdates }, { new: true })

        return res.status(200).send({ status: true, message: "Order details Updated", data: order })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



module.exports.createOrder = createOrder;
module.exports.updateOrder = updateOrder;

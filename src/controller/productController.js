const productModel = require("../Models/productModel");
const validator = require("../validator/validator")
const aws = require("../aws/aws");


const createProduct = async (req, res) => {
    try {
        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: 'No data provided' }) }

        let files = req.files;
        if (files.length == 0) { return res.status(400).send({ status: false, message: "Please provide a profile image" }) }

        //validations

        if (!(validator.isValid(data.title))) { return res.status(400).send({ status: false, message: "Title is required" }) }

        let isUniqueTitle = await productModel.findOne({ title: data.title })
        if (isUniqueTitle) { return res.status(400).send({ status: false, message: 'Title already exist. Please provide a unique title.' }) }

        if (!(validator.isValid(data.description))) { return res.status(400).send({ status: false, message: "Description is required" }) }

        if (!(validator.isValid(data.price))) { return res.status(400).send({ status: false, message: "Price is required" }) }

        if (!(validator.isRightFormatprice(data.price))) { return res.status(400).send({ status: false, message: `${data.price} is not a valid price. Please provide input in numbers.` }) }

        if (!(validator.isValid(data.currencyId))) { return res.status(400).send({ status: false, message: "Currency Id is required" }) }

        if (data.currencyId.trim() !== "INR") { return res.status(400).send({ status: false, message: "Please provide Indian Currency Id" }) }

        if (!(validator.isValid(data.currencyFormat))) { return res.status(400).send({ status: false, message: "Price is required" }) }

        if (data.currencyFormat.trim() !== "₹") { return res.status(400).send({ status: false, message: "Please provide right format for currency" }) }

        if (!(validator.isValid(data.availableSizes))) { return res.status(400).send({ status: false, message: "Please provide available size for your product" }) }

        data.availableSizes = JSON.parse(data.availableSizes);

        if (!(validator.isValidArray(data.availableSizes))) { return res.status(400).send({ status: false, message: 'Please provide available size for your product' }) }

        if (!(validator.validForEnum(data.availableSizes))) { return res.status(400).send({ status: false, message: "Please provide an appropriate size" }) }

        const uploadedFileURL = await aws.uploadFile(files[0])

        data.productImage = uploadedFileURL;

        const newData = await productModel.create(data);

        return res.status(201).send({ status: true, message: 'Product created successfully', data: newData })



    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


const getProductbyQuery = async function (req, res) {
    try {


        let { size, name, priceGreaterThan, priceLessThan, priceSort } = req.query


        let filters = { isDeleted: false }

        if (size != null) {
            if (!validator.validForEnum(size)) {
                return res.status(400).send({ status: false, msg: 'No Such Size Exist in our Filters ... Select from ["S", "XS", "M", "X", "L", "XXL", "XL"]' })
            }
            filters["availableSizes"] = size
        }

        let arr = []

        if (name != null) {

            const random = await productModel.find({ isDeleted: false }).select({ title: 1, _id: 0 })
            for (let i = 0; i < random.length; i++) {
                var checkTitle = random[i].title

                let check = checkTitle.includes(name)
                if (check) {
                    arr.push(random[i].title)
                }

            }
            filters["title"] = arr

        }
        if (priceGreaterThan != null && priceLessThan == null) {
            filters["price"] = { $gt: priceGreaterThan }
        }


        if (priceGreaterThan == null && priceLessThan != null) {
            filters["price"] = { $lt: priceLessThan }
        }

        if (priceGreaterThan != null && priceLessThan != null) {
            filters["price"] = { $gte: priceGreaterThan, $lte: priceLessThan }
        }

        if (priceSort != null) {
            if (priceSort == 1) {
                const products = await productModel.find(filters).sort({ price: 1 })
                if (products.length == 0) {
                    return res.status(404).send({ status: false, message: "No data found that matches your search" })
                }
                return res.status(200).send({ status: true, message: "Results",count: products.length, data: products })
            }

            if (priceSort == -1) {
                const products = await productModel.find(filters).sort({ price: -1 })
                if (products.length == 0) {
                    return res.status(404).send({ status: false, message: "No data found that matches your search" })
                }
                return res.status(200).send({ status: true, message: "Results", count: products.length, data: products })
            }

        }

        const products = await productModel.find(filters)
        if (products.length == 0) {
            return res.status(404).send({ status: false, message: "No data found that matches your search" })
        }
        return res.status(200).send({ status: true, message: "Results",count: products.length, data: products })


    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }

}



const getProductsById = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!(validator.isValidObjectId(productId))) {
            return res.status(400).send({ status: false, msg: "productId is not valid" })
        }
        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) {
            return res.status(404).send({ status: false, msg: "product not found" })
        }
        return res.status(200).send({ status: true, data: findProduct })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }

}


const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!(validator.isValid(productId))) {
            return res.status(400).send({ status: false, message: "Product Id is required" })
        }
        if (!(validator.isValidObjectId(productId))) {
            return res.status(400).send({ status: false, message: "Product Id is invalid" })
        }
        let updateData = req.body
        let objectData = {}

        if (Object.keys(updateData) == 0) {
            return res.status(400).send({ status: false, message: "enter data to update" })
        }

        if (validator.isValid(updateData.title)) {
            let findTitle = await productModel.findOne({ title: updateData.title })
            if (findTitle) {
                return res.status(400).send({ status: false, message: " Title already in use. Enter a unique title" })
            }
            objectData.title = updateData.title
        }
        if (validator.isValid(updateData.description)) {
            objectData.description = updateData.description
        }
        if (validator.isValid(updateData.price)) {
            if (!(validator.isRightFormatprice(updateData.price))) {
                return res.status(400).send({ status: false, message: `${updateData.price} is not a valid price. Please provide input in numbers.` })
            }

            objectData.price = updateData.price
        }
        if (validator.isValid(updateData.currencyId)) {
            if (updateData.currencyId.trim() !== "INR") {
                return res.status(400).send({ status: false, message: "Please provide Indian Currency Id" })
            }
            objectData.currencyId = updateData.currencyId
        }
        if (validator.isValid(updateData.currencyFormat)) {
            if (data.currencyFormat.trim() !== "₹") {
                return res.status(400).send({ status: false, message: "Please provide right format for currency" })
            }
            objectData.currencyFormat = updateData.currencyFormat
        }
        let file = req.files
        if (file.length > 0) {
            let uploadFileUrl = await uploadFile(file[0])
            objectData.productImage = uploadFileUrl
        }

        if (validator.isValid(updateData.availableSizes)) {
            updateData.availableSizes = JSON.parse(updateData.availableSizes)
            if (!(validator.validForEnum(updateData.availableSizes))) {
                return res.status(400).send({ status: false, message: "Please provide a valid size" })
            }
            if (!(validator.isValidArray(updateData.availableSizes))) {
                return res.status(400).send({ status: false, message: "Please provide available size for your product" })
            }

        }
        if (validator.isValid(updateData.installments)) {
            objectData.installments = updateData.installments
        }

        const updateProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, objectData, { new: true })
        if (!updateProduct) {
            return res.status(404).send({ status: false, msg: "This product is not available or has been deleted" })
        }
        return res.status(200).send({ status: true, msg: "Product updated successfully", data: updateProduct })


    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}


const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!(validator.isValidObjectId(productId))) {
            return res.status(400).send({ status: false, message: "invalid productId" })
        }
        let product = await productModel.findOne({ _id: productId })
        if (!product) {
            return res.status(404).send({ status: false, message: "Document not found" })
        }
        if (product.isDeleted == true) {
            return res.status(404).send({ status: false, message: "This document already deleted" })
        }
        let data = { isDeleted: true, deletedAt: Date.now() }

        const deleteData = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: data }, { new: true }).select({ __v: 0 })
        return res.status(200).send({ status: true, message: "delete data successfully", data: deleteData })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}









module.exports.createProduct = createProduct;
module.exports.getProductbyQuery = getProductbyQuery;
module.exports.getProductsById = getProductsById;
module.exports.updateProduct = updateProduct;
module.exports.deleteProduct = deleteProduct;
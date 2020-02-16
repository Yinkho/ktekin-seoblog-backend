const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        min: 3,
        max: 160,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    body: {
        type: {},
        required: true,
        min: 200,
        max: 2000000
    },
    // excerpt is a part of text to read the beggining of the article (with SHOW MORE... at the end)
    excerpt: {
        type: String,
        max: 50
    },
    // Meta title
    mtitle: {
        type: String
    },
    // Meta description
    mdesc: {
        type: String
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    categories: [{
        type: ObjectId,
        ref: 'Category',
        required: true
    }],
    tags: [{
        type: ObjectId,
        ref: 'Tag',
        required: true
    }],
    postedBy: {
        type: ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

module.exports = mongoose.model('Blog', blogSchema)
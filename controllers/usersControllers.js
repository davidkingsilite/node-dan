const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')


//@des getAllUser
//@route  get
//@access private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users){
        return res.status(400).json({message: 'Users not found'})
    }
     res.json(users)
})



//@des createUser
//@route  post
//@access private
const createNewUser = asyncHandler(async(req, res) =>{
    const {username, password, roles} = req.body

    //confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length){
        return res.status(400).json({message: 'All fields are required'})
    }

    //check for duplicate 
    const duplicate = await User.findOne({username}).lean().exec()
    if (duplicate){
       return res.status(409).json({message: 'Username already exist'})
    }
     //hashed password
    const hashedPwd = await bcrypt.hash(password, 10) //salt round

    const userObject = {username, "password":hashedPwd, roles}

    //create and save user
    const user = await User.create(userObject)

    if(user){
        res.status(201).json({message: `New User ${username} created`})
    } else{
        res.status(400).json({message:'Invalid details received'})
    }
    
})


//@des updateUser
//@route  patch/user
//@access private
const updateUser = asyncHandler(async(req, res) =>{
    const {id, username, roles, active, password} = req.body

    //confirm data
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean'){
        return res.status(400).json({message: 'All fields are required'})
    }

    const user = await User.findById(id).exec()

    if (!user?.lenght) {
        return res.status(400).json({message: 'User Not Found'})
    }

    // check duplicate

    const duplicate = await User.findOne({username}).lean().exec()
    // allow updates to the orignal user

    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({message: 'Duplicate Username'})
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password){
        user.password = await bcrypt.hash(password, 10) //salt rounds
    }

    const updatedUser = await user.save()

    res.json({ message: `${updatedUser.username} updated` })
})


//@des deleteUser
//@route  delete/user
//@access private
const deleteUser = asyncHandler(async(req, res) =>{
    const { id } = req.body

    if(!id){
        return res.status(400).json({message: 'User ID is required'})
    }

    const notes = await Note.findOne({ user: id}).lean().exec()
        if(notes?.lenght){
            return res.status(400).json({message: 'User has assigned notes'})
        }

        const user = await User.findById(id).exec()

        if (!user) {
            return res.status(400).json({message: 'User not found'})
        }

        const result = await user.deleteOne()

        const reply = `Username ${result.username} with ID ${result._id} deleted`

        res.json(reply)
})


module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}
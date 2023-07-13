const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')


//@des getAllUser
//@route  get
//@access private
const getAllNotes = asyncHandler(async (req, res) => {
    //get all the notes from mongoDB
    const notes = await Note.find().lean()
      //if no note 
    if (!notes?.length){
        return res.status(400).json({message: 'No Notes found'})
    }
   
    // Add username to each note before sending the reponse 
    // see promise.all
    // you could also do this with a for.. of loop
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))
    res.json(notesWithUser)
})


//@des createNewNotes
//@route  post/ notes
//@access private
const createNewNote = asyncHandler(async(req, res) =>{
    const { user, title, text} = req.body

    //confirm data
    if(!user || !title|| !text){
        return res.status(400).json({message: 'All fields are required'})
    }

    //check for duplicate 
    const duplicate = await Note.findOne({ title }).lean().exec()
    if (duplicate){
       return res.status(409).json({ message: 'Dulpicate note title' })
    }

    //create and store the new notes
    const note =  await Note.create({ user, title, text })
    
    if(note){ //created
        res.status(201).json({ message: 'New note created'})
    } else{
        res.status(400).json({message:'Invalid note data received'})
    }
    
})


//@des updateUser
//@route  patch/user
//@access private
const updateNote = asyncHandler(async(req, res) =>{
    const {id, user, title, text, completed } = req.body

    //confirm data
    if(!id || !user|| !title || !text || typeof completed !== 'boolean'){
        return res.status(400).json({message: 'All fields are required'})
    }

    // confirm note exists to updates
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({message: 'Note not Found'})
    }

    // check duplicate
    const duplicate = await User.findOne({title}).lean().exec()
    // allow renaming to the orignal user

    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({message: 'Duplicate note title'})
    }

    note.username = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json({ message: `${updatedNote.title} updated` })
})


//@des deleteUser
//@route  delete/user
//@access private
const deleteNote = asyncHandler(async(req, res) =>{
    const { id } = req.body 
    //confirm data
    if(!id){
        return res.status(400).json({ message: 'Note ID is required' })
    }
    // confirm note exists to delete
    const note = await Note.findById(id).exec()
        if(!note){
            return res.status(400).json({ message: 'Note not found' })
        }

        const result = await note.deleteOne()

        const reply = `Username ${result.title} with ID ${result._id} deleted`

        res.json(reply)
})


module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}
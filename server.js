// require statements
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer')
const bodyParser = require("body-parser");
const peerServer = ExpressPeerServer(server, {
  debug: true
})
const { v4: uuidV4 } = require('uuid')

// app config
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use('/peerjs', peerServer)

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


let data = {}

// ------------VIEWS----------

// home
app.get('/', (req, res) => {
  res.render('home')
})
app.post('/', (req, res) => {
  let roomId = req.body.roomId
  const firstName = req.body.firstName
  const lastName = req.body.lastName

  if(roomId == "") {
    roomId = uuidV4()
  }

  data = {
    roomId: roomId,
    firstName: firstName,
    lastName: lastName
  }
  res.render("room", {obj: data})

}, )

// end 
app.get("/end", (req, res) => {
  res.render("end")
})

// about 
app.get("/about", (req, res) => {
  res.render("about")
})

// ----------- socket io connection -------------
io.on('connection', socket => {

  // listens for when a user joins a room
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId)

    //  listens for when a user is disconnected
    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })

    // listens for when a user sends a message
    socket.on('send-message', (data) => {
      socket.broadcast.to(data.roomId).emit('receive-message', {message: data.message, firstName: data.firstName})
    })

    // listens for when a name tag is to be added
    socket.on('name-tag-added', data => {
      socket.broadcast.to(data.roomId).emit('user-name-tag-added', {userId: data.userId, iconClass: data.iconClass})
    })

    // listens for when a name tag is to be removed
    socket.on('name-tag-removed', data => {
      socket.broadcast.to(data.roomId).emit('user-name-tag-removed', {userId: data.userId, iconClass: data.iconClass})
    })

  })
})

server.listen(process.env.PORT||3000)
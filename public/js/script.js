const socket = io('/')

console.log(ROOM_ID)

// getting required elements
const videoGrid = document.getElementById('video-grid')
const video_section = document.getElementsByClassName("video-section")[0]
const chat_section = document.getElementsByClassName("chat-section")[0]
const participants_section = document.getElementsByClassName("participants-section")[0]
const participants_div = document.getElementsByClassName("participants")[0]
const messages = document.getElementsByClassName("messages")[0]
const mute_unmute = document.getElementsByClassName("mute-unmute")[0]
const play_stop = document.getElementsByClassName("play-stop")[0]

// initializing variables
const myVideo = document.createElement('video')
let myVideoStream
let myScreenShareStream
let isShowingChat = true
let isShowingParticipants = false
const peers = {}
let participants = []
const callList = []
const answerList = []
let myDetails = {
  id: '',
  firstName: '',
  lastName: '',
}



const peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  // port: '443'
  port: '3000'
})






// getting the user's video and audio streams
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
}).then(stream => {

  myVideoStream = stream
  myVideo.muted = true
  addVideoStream(myVideo, myVideoStream, myDetails.id)
  addNameTag(myDetails.id)

  // listens for when a new user is connected to our room
  socket.on('user-connected', userId => {
    setTimeout(() => {connectToNewUser(userId, stream)}, 1000);
  })

  peer.on('call', call => {
    console.log('answering call...')
    call.answer(stream)
    peers[call.peer] = call
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      if(!answerList[call.peer]) {
        console.log("checkkkkkkkkkkk")
        console.log(answerList)
        addVideoStream(video, userVideoStream, call.peer)
        // addNameTag(call.peer)
        answerList[call.peer] = call
      }
    })
  })

})

// listens for when a user disconnects from the room, then closes peer connection
socket.on('user-disconnected', userId => {
  removeParticipant(userId)
  let video = document.getElementsByClassName(userId)[0].parentElement.parentElement
  video.remove()
  if (peers[userId]) {
    peers[userId].close()
  } 
})

// listens for when a connection to the PeerServer is established, then joins the user to the room
peer.on('open', id => {
  myDetails.id = id
  myDetails.firstName = firstName
  myDetails.lastName = lastName
  addParticipant(myDetails, true)
  console.log(`My userId: ${id}`)
  socket.emit('join-room', ROOM_ID, id)
})


// connects us to the new user that joined the room
function connectToNewUser(userId, stream) {
  console.log(`connecting to ${userId}...`)

  var conn = peer.connect(userId)
  conn.on('open', () => {
    conn.on('data', data => {
      addParticipant(data)
      newUserJoinedRoom(data)
      addNameTag(data.id)
    })
    conn.send(myDetails);
  });

  const call = peer.call(userId, stream)
  const userVideo = document.createElement('video')

  // listens for user's stream 
  call.on('stream', userVideoStream => {

    // checks if the userId already exists in callList, so that 'stream' event is fired only once
    if(!callList[call.peer]) {
      addVideoStream(userVideo, userVideoStream, userId)
      callList[call.peer] = call
    }
    
  })

  call.on('close', () => {
    console.log(`${userId}  is leaving..............`)
  })

  peers[userId] = call

}

// listens for peer connection, then adds the required data
peer.on('connection', conn => {
  conn.on('data', data => {
    addParticipant(data)
    addNameTag(data.id)
    conn.send(myDetails)
  });
});

// adds the video stream to the screen
function addVideoStream(video, stream, id) {

  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })

  const div = document.createElement('div')
  div.className = "video-container"
  div.append(video)

  const video__overlay = document.createElement('div')
  video__overlay.className = "video__overlay"
  const name = document.createElement('div')
  name.className = id
  name.innerHTML = "No Name"
  video__overlay.append(name)

  div.append(video__overlay)

  videoGrid.append(div)
  
}

// adds the name tag with the video
function addNameTag(id) {
  let name_element = document.getElementsByClassName(id)[0]
  console.log(name_element)
  for(let i=0; i<participants.length; i++) {
    if(participants[i].id == id) {
      console.log("DONE")
      name_element.innerHTML = `${participants[i].firstName} ${participants[i].lastName}`
      break
    }
  }
}


// ------------------------- MIC MUTE/UNMUTE BUTTON -------------------------


// toggles the mute button
const toggleMute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled
  if(enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false
    setMuteButton()
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true
    setUnmuteButton()
  }
}

// sets the unmute button
const setUnmuteButton = () => {
  mute_unmute.classList.remove("fa-microphone-slash")
  mute_unmute.classList.add("fa-microphone")
  mute_unmute.classList.remove("mute")
  removeNameTagIcon(myDetails.id, "fa-microphone-slash")
  socket.emit('name-tag-removed', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-microphone-slash"})
}

// sets the mute button
const setMuteButton = () => {
  mute_unmute.classList.remove("fa-microphone")
  mute_unmute.classList.add("fa-microphone-slash")
  mute_unmute.classList.add("mute")
  addNameTagIcon(myDetails.id, "fa-microphone-slash")
  socket.emit('name-tag-added', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-microphone-slash"})
}


// ------------------------- VIDEO PLAY/STOP BUTTON -------------------------


// toggles the video button
const toggleVideo = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled
  if(enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false
    setStopButton()
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true
    setPlayButton()
  }
}


// sets the stop button
const setStopButton = () => {
  play_stop.classList.add("fa-video-slash")
  play_stop.classList.remove("fa-video")
  play_stop.classList.add("stop")
  addNameTagIcon(myDetails.id, "fa-video-slash")
  socket.emit('name-tag-added', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-video-slash"})
}


// sets the play button
const setPlayButton = () => {
  play_stop.classList.remove("fa-video-slash")
  play_stop.classList.add("fa-video")
  play_stop.classList.remove("stop")
  removeNameTagIcon(myDetails.id, "fa-video-slash")
  socket.emit('name-tag-removed', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-video-slash"})
}



// ------------------------- ICONS NEXT TO NAME TAG -------------------------

// adds the icon (mute/stop) next to name tag 
const addNameTagIcon = (userId, iconClass) => {
  let name_tag = document.getElementsByClassName(userId)[0]
  let icon = document.createElement('i')
  icon.className = `name-tag-icon fas ${iconClass}`
  name_tag.append(icon)
}

// removes the icon (mute/stop) next to name tag 
const removeNameTagIcon = (userId, iconClass) => {
  let name_tag = document.getElementsByClassName(userId)[0]
  if(name_tag) {
    name_tag.getElementsByClassName(iconClass)[0].remove()
  }
}

// listens for when icon is added
socket.on('user-name-tag-added', data => {
  addNameTagIcon(data.userId, data.iconClass)
}) 

// listens for when icon is removed
socket.on('user-name-tag-removed', data => {
  removeNameTagIcon(data.userId, data.iconClass)
}) 


// ------------------------- CHAT ROOM -------------------------

// message that user sends
let message = $("input")

// scrolls chat to the bottom
const scrollToBottom = () => {
  let chat_window = $(".chat-window")
  chat_window.scrollTop(chat_window.prop("scrollHeight"))
}

// returns current time
const getTime = () => {
  let today = new Date()
  let hours = today.getHours()
  let minutes = today.getMinutes()
  minutes = minutes < 10 ? '0' + minutes : minutes
  let currentTime = `${hours}:${minutes}`
  return currentTime
}

// message that shows new user connected in chat room
const newUserJoinedRoom = data => {
  const p = document.createElement('p')
  p.innerHTML = `${data.firstName} ${data.lastName} just joined!`
  p.className = "new-user-joined"
  messages.append(p)
  addNameTag(data.id)
  scrollToBottom()
}

// creates a message along with NAME of the user
const createMessageWithName = (message, firstName, className) => {

  // outer div
  const div = document.createElement('div')
  div.className = className

  // inner firstName div
  let firstName_div = document.createElement('div')
  firstName_div.className = "row"

  let firstName_p = document.createElement('p')
  firstName_p.className = "firstName col-10"
  firstName_p.innerHTML = firstName

  let dash_p = document.createElement('p')
  dash_p.className = "col-2"
  dash_p.innerHTML = "==="
  

  // inner message div
  let message_div = document.createElement('div')
  message_div.className = "row"

  let message_p = document.createElement('p')
  message_p.className = "message col-10"
  message_p.innerHTML = message

  let time_p = document.createElement('p')
  time_p.className = "time col-2"
  time_p.innerHTML = getTime()

  // appening to inner divs
  firstName_div.append(firstName_p)
  firstName_div.append(dash_p)
  message_div.append(message_p)
  message_div.append(time_p)
  if(className == "user-message") {
    firstName_p.className += " order-last"
    message_p.className += " order-last"
  } 
  
  // appending everything to main outer div
  div.append(firstName_div)
  div.append(message_div)
  
  messages.append(div)
}

// creates message to be displayed in the chat room
const createMessage = (message, firstName, className) => {

  let children = document.getElementsByClassName("messages")[0].children.length

  // if someone has already sent a message in the chat before
  if(children != 0) {
    
    // get the last person who sent the message
    const latestFirstName = document.getElementsByClassName("messages")[0].lastChild.getElementsByClassName("firstName")[0]

    // if the name of the last person exists
    if(typeof latestFirstName !== 'undefined') {

      // message already sent by this person, so just omit name
      if(latestFirstName.innerHTML == firstName) {

        // message div
        let message_div = document.createElement('div')
        message_div.className = "row"

        let message_p = document.createElement('p')
        message_p.className = "message col-10"
        message_p.innerHTML = message

        let time_p = document.createElement('p')
        time_p.className = "time col-2"
        time_p.innerHTML = getTime()

        message_div.append(message_p)
        message_div.append(time_p)

        if(document.getElementsByClassName("messages")[0].lastChild.classList.contains("user-message")) {
          message_p.className += " order-last"
        }

        document.getElementsByClassName("messages")[0].lastChild.append(message_div)
      } 
      else {
        createMessageWithName(message, firstName, className)
      }
    } else {
      createMessageWithName(message, firstName, className)
    }
  } else {
    createMessageWithName(message, firstName, className)
  }
}

// sending my message
$("html").keydown(e => {
  if(e.which == 13 && message.val().length !== 0) {
    createMessage(message.val(), myDetails.firstName, "my-message")
    scrollToBottom()
    socket.emit('send-message', {roomId: ROOM_ID, message: message.val(), firstName: myDetails.firstName})
    message.val("")
  }
})

// receiving user's message
socket.on('receive-message', (data) => {
  createMessage(data.message, data.firstName, "user-message")
  scrollToBottom()
})

// toggle chat room visibility
const toggleChat = () => {

  if(isShowingParticipants) {
    isShowingParticipants = false
    document.getElementsByClassName("bottom-btn")[3].getElementsByTagName("div")[0].classList.remove("show-chat")
  }
    
  changeSections(participants_section, chat_section, isShowingChat)

  if(isShowingChat) {
    document.getElementsByClassName("bottom-btn")[2].getElementsByTagName("div")[0].classList.remove("show-chat")
    isShowingChat = false
  } else {
    document.getElementsByClassName("bottom-btn")[2].getElementsByTagName("div")[0].classList.add("show-chat")
    isShowingChat = true
  }

};


// ------------------------- PARTICIPANTS -------------------------

// adding a participant to the PARTICIPANT section
const addParticipant = (participant, isMe = false) => {
  participants.push(participant)
  let fullName = `${participant.firstName} ${participant.lastName}`
  const p = document.createElement('p')
  p.id = participant.id
  p.innerHTML = fullName
  if(isMe) {
    p.innerHTML += " (You)"
  }
  participants_div.append(p)
}

// removing the given participant from the PARTICIPANT section
const removeParticipant = id => {
  const participant = document.getElementById(id)
  if(participant) {
    participant.remove()
  }
}

// toggle PARTICIPANT section visibility (initially: hidden)
const toggleParticipants = () => {
  if(isShowingChat) {
    isShowingChat = false
    document.getElementsByClassName("bottom-btn")[2].getElementsByTagName("div")[0].classList.remove("show-chat")
  }

  changeSections(chat_section, participants_section, isShowingParticipants)
  
  if(!isShowingParticipants) {
    isShowingParticipants = true
    document.getElementsByClassName("bottom-btn")[3].getElementsByTagName("div")[0].classList.add("show-chat")
  } else {
    isShowingParticipants = false
    document.getElementsByClassName("bottom-btn")[3].getElementsByTagName("div")[0].classList.remove("show-chat")
  }

}


// ------------------------- CHANGE SECTIONS -------------------------

// To switch between two sections (From Chat to Participants and vice-verse)
const changeSections = (sectionOne, sectionTwo, isShowingTwo) => {
  if(!isShowingTwo) {
    if(sectionOne.style.display == "none" || sectionOne.style.display == "") {
      video_section.classList.remove("col-12")
      video_section.classList.add("col-9")
    }
    sectionTwo.style.display = "block"
    sectionOne.style.display = "none"
  }
  else {
    video_section.classList.remove("col-9")
    video_section.classList.add("col-12")
    sectionTwo.style.display = "none"
  }
}




// ------------------------- COPY ROOM ID -------------------------
function copyToClipboard() {
  var tempInput = document.createElement("input");
  tempInput.value = ROOM_ID;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
  var tooltip = document.getElementsByClassName("tooltiptext")[0]
  tooltip.innerHTML = `Copied: ${ROOM_ID}`;

}

function outFunc() {
  var tooltip = document.getElementsByClassName("tooltiptext")[0]
  tooltip.innerHTML = "Copy to clipboard";
}






// ------------------------- SCREEN SHARE -------------------------
let displayMediaOptions = {
  video: true,
  audio: true,
}
let isSharing = false

const screenShare = () => {
  if(isSharing) {
    stopScreenShare()
  } else {
    startScreenShare()
  }
}

const startScreenShare = async () => {

  myScreenShareStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
  myScreenShareVideo = document.createElement('video')
  addVideoStream(myScreenShareVideo, myScreenShareStream)
  console.log("--- comparing myVideoStream and myScreenShareStream ----")
  console.log(myVideoStream)
  console.log(myScreenShareStream)
  participants.forEach(participant => peer.call(participant.id, myScreenShareStream))
  isSharing = true
}

const stopScreenShare = async () => {
  try {
    parent_div = myScreenShareVideo.parentElement
    parent_div.remove()
  
    isSharing = false
  } catch(error) {
    console.log(error)
  }
}







const socket = io('/')

// getting required elements
const videoGrid = document.getElementById('video-grid')
const video_section = document.getElementsByClassName("video-section")[0]
const chat_section = document.getElementsByClassName("chat-section")[0]
const participants_section = document.getElementsByClassName("participants-section")[0]
const participants_div = document.getElementsByClassName("participants")[0]
const messages = document.getElementsByClassName("messages")[0]
const mute_unmute = document.getElementsByClassName("mute-unmute")[0]
const play_stop = document.getElementsByClassName("play-stop")[0]
const hand_raise = document.getElementsByClassName("hand-raise")[0]

// initializing variables
const myVideo = document.createElement('video')
let myVideoStream
let myScreenShareStream
let isShowingChat = true
let isShowingParticipants = false
let isHandRaised = false
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
  port: '443'
})

// getting the user's video and audio streams
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
}).then(stream => {

  myVideoStream = stream
  addVideoStream(myVideo, myVideoStream, myDetails.id)
  myVideo.muted = true

  // listens for when a new user is connected to our room
  socket.on('user-connected', userId => {
    setTimeout(() => {connectToNewUser(userId, stream)}, 1000);
  })

  peer.on('call', call => {
    call.answer(stream)
    peers[call.peer] = call
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      if(!answerList[call.peer]) {
        addVideoStream(video, userVideoStream, call.peer)
        answerList[call.peer] = call
      }
    })
  })

})

// listens for when a user disconnects from the room, then closes peer connection
socket.on('user-disconnected', userId => {

  for(let i=0; i<participants.length; i++) {
    if(participants[i].id == userId) {
      userLeftRoom(participants[i])
      break
    }
  }

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
  socket.emit('join-room', ROOM_ID, id)
})


// connects us to the new user that joined the room
function connectToNewUser(userId, stream) {
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
  video__overlay.append(name)

  div.append(video__overlay)

  videoGrid.append(div)

  if(id == myDetails.id) {
    addNameTag(myDetails.id)
  }

  Dish()
  
}

// adds the name tag with the video
function addNameTag(id) {

  if(id == "") {
    let video__overlay = document.getElementsByClassName("video__overlay")[0]
    let name_element = video__overlay.firstChild
    name_element.innerHTML = "(You)"
  }

  let name_element = document.getElementsByClassName(id)[0]
  for(let i=0; i<participants.length; i++) {
    if(participants[i].id == id) {
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


// ------------------------- RAISE HAND -------------------------

// toggles the raise hand button
const raiseHand = () => {
  if(!isHandRaised) {
    isHandRaised = true
    hand_raise.classList.add("raised")
    addNameTagIcon(myDetails.id, "fa-hand-paper")
    socket.emit('name-tag-added', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-hand-paper"})
  } else {
    isHandRaised = false
    hand_raise.classList.remove("raised")
    removeNameTagIcon(myDetails.id, "fa-hand-paper")
    socket.emit('name-tag-removed', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-hand-paper"})
  }
  
}


// ------------------------- ICONS NEXT TO NAME TAG -------------------------

// adds the icon (mute/stop) next to name tag 
const addNameTagIcon = (userId, iconClass) => {
  let name_tag = document.getElementsByClassName(userId)[0]
  if(userId == myDetails.id) {
    let video__overlay = document.getElementsByClassName("video__overlay")[0]
    name_tag = video__overlay.firstChild
  }
  let icon = document.createElement('i')
  icon.className = `name-tag-icon fas ${iconClass}`

  if(iconClass == "fa-hand-paper") {
    icon.classList.add("raised")
  } else if(iconClass == "fa-microphone-slash" || iconClass == "fa-video-slash") {
    icon.classList.add("mute")
  }
  if(typeof name_tag !== "undefined") {
    name_tag.append(icon)
  }
}

// removes the icon (mute/stop) next to name tag 
const removeNameTagIcon = (userId, iconClass) => {
  let name_tag = document.getElementsByClassName(userId)[0]
  if(userId == myDetails.id) {
    let video__overlay = document.getElementsByClassName("video__overlay")[0]
    name_tag = video__overlay.firstChild
  }
  if(typeof name_tag !== "undefined") {
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

// message that shows user disconnected in chat room
const userLeftRoom = data => {
  const p = document.createElement('p')
  p.innerHTML = `${data.firstName} ${data.lastName} just left!`
  p.className = "user-left"
  messages.append(p)
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

  const i = document.createElement("i")
  i.className = "col-2 fas fa-user-circle chat-name-icon"

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
  firstName_div.append(i)
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
    document.getElementsByClassName("bottom-btn")[4].getElementsByTagName("div")[0].classList.remove("show-chat")
  }
    
  changeSections(participants_section, chat_section, isShowingChat)

  if(isShowingChat) {
    document.getElementsByClassName("bottom-btn")[3].getElementsByTagName("div")[0].classList.remove("show-chat")
    isShowingChat = false
  } else {
    document.getElementsByClassName("bottom-btn")[3].getElementsByTagName("div")[0].classList.add("show-chat")
    isShowingChat = true
  }

  Dish()

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
    document.getElementsByClassName("bottom-btn")[3].getElementsByTagName("div")[0].classList.remove("show-chat")
  }

  changeSections(chat_section, participants_section, isShowingParticipants)
  
  if(!isShowingParticipants) {
    isShowingParticipants = true
    document.getElementsByClassName("bottom-btn")[4].getElementsByTagName("div")[0].classList.add("show-chat")
  } else {
    isShowingParticipants = false
    document.getElementsByClassName("bottom-btn")[4].getElementsByTagName("div")[0].classList.remove("show-chat")
  }

  Dish()

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


// ------------------------- VIDEO GRID ALIGNMENT -------------------------

// Area
function Area(Increment, Count, Width, Height, Margin = 10) {
  let i = w = 0;
  let h = Increment * 0.75 + (Margin * 2);
  while (i < (Count)) {
      if ((w + Increment) > Width) {
        w = 0;
        h = h + (Increment * 0.75) + (Margin * 2);
      }
      w = w + Increment + (Margin * 2);
      i++;
  }
  if (h > Height) return false;
  else return Increment;
}

// Dish:
function Dish() {

  // variables:
  let Margin = 2;
  let Scenary = document.getElementById('video-grid');
  let Width = Scenary.offsetWidth - (Margin * 2);
  let Height = Scenary.offsetHeight - (Margin * 2);
  let Cameras = document.getElementsByClassName('video-container');
  let max = 0;
  
  let i = 1;
  while (i < 5000) {
    let w = Area(i, Cameras.length, Width, Height, Margin);
    if (w === false) {
      max =  i - 1;
      break;
    }
    i++;
  }
  
  // set styles
  max = max - (Margin * 2);
  setWidth(max, Margin);
}

// Set Width and Margin 
function setWidth(width, margin) {
  let Cameras = document.getElementsByClassName('video-container');
  for (var s = 0; s < Cameras.length; s++) {
    Cameras[s].style.width = width + "px";
    Cameras[s].style.margin = margin + "px";
    Cameras[s].style.height = (width * 0.75) + "px";
  }
}

// Load and Resize Event
window.addEventListener("load", function (event) {
  Dish();
  window.onresize = Dish;
}, false);
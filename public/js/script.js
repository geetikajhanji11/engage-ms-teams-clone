// import { addParticipant, removeParticipant } from "./participants.js"

const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '3000'
})

let participants = []

const peers = {}
const callList = []
const answerList = []


console.log(ROOM_ID)


const myVideo = document.createElement('video')
let myScreenShareVideo
myVideo.muted = true
let myVideoStream
let myScreenShareStream
let myDetails = {
  id: '',
  firstName: '',
  lastName: '',
}

// 'stream' fired twice if both video and audio are asked
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
}).then(stream => {

  // console.log("appending my video stream...")
  myVideoStream = stream
  // console.log("my video stream")
  // console.log(myVideoStream)

  addVideoStream(myVideo, stream, myDetails.id)
  addNameTag(myDetails.id)

  socket.on('user-connected', userId => {
    // console.log(`new user connected ${userId}`)
    setTimeout(() => {connectToNewUser(userId, stream)}, 1000);
    // connectToNewUser(userId, stream)
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

socket.on('user-disconnected', userId => {
  console.log(`USER DISCONNECT: ${userId}`)
  removeParticipant(userId)
  let video = document.getElementsByClassName(userId)[0].parentElement.parentElement
  video.remove()
  if (peers[userId]) {
    console.log("closing.................")
    peers[userId].close()
  } 
})

peer.on('open', id => {
  myDetails.id = id
  myDetails.firstName = firstName
  myDetails.lastName = lastName
  // participants.push(myDetails)
  addParticipant(myDetails, true)
  console.log(`My userId: ${id}`)
  socket.emit('join-room', ROOM_ID, id)
})

// message that shows new user connected in chat room
const newUserJoinedRoom = data => {
  const p = document.createElement('p')
  p.innerHTML = `${data.firstName} ${data.lastName} just joined!`
  p.className = "new-user-joined"
  messages.append(p)
  addNameTag(data.id)
  scrollToBottom()
}


function connectToNewUser(userId, stream) {
  console.log(`connecting to ${userId}...`)

  // added this
  var conn = peer.connect(userId)
  conn.on('open', () => {
    conn.on('data', data => {
      // console.log(data)
      // participants.push(data)
      addParticipant(data)
      // console.log(participants)
      newUserJoinedRoom(data)

    })
    conn.send(myDetails);
  });

  const call = peer.call(userId, stream)
  const video = document.createElement('video')


  call.on('stream', userVideoStream => {

    // added so that stream is fired only once
    if(!callList[call.peer]) {
      // console.log(`appending ${userId} video stream...`)
      addVideoStream(video, userVideoStream, userId)
      // addNameTag(userId)
      callList[call.peer] = call
    }
    
  })

  call.on('close', () => {
    // video.parentElement.remove()
    console.log(`${userId}  is leaving..............`)
    // removeParticipant(userId)

  })

  peers[userId] = call
  console.log("PEERS")
  console.log(peers)

}


// added this
peer.on('connection', conn => {
  conn.on('data', data => {
    console.log(data);
    // participants.push(data)
    addParticipant(data)
    addNameTag(data.id)
    conn.send(myDetails)
  });
});

function addVideoStream(video, stream, id) {

  console.log(`adding: ${id} STREAM`)
  console.log("displaying all participants")
  console.log(participants)
  
  // let obj;
  // console.log("in loop")
  // for(let i=0; i<participants.length; i++) {
  //   console.log(participants[i])
  //   if(participants[i].id == id) {
  //     obj = participants[i]
  //   }
  // }
  // console.log(obj)

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
  // name.innerHTML = "test name"
  video__overlay.append(name)

  div.append(video__overlay)

  videoGrid.append(div)
  
}

function addNameTag(id) {
  console.log("------DEBUG-----------")
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


// ---------- Video Controls ----------

// MUTE - UNMUTE
const mute_unmute = document.getElementsByClassName("mute-unmute")[0]

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

const setUnmuteButton = () => {
  mute_unmute.classList.remove("fa-microphone-slash")
  mute_unmute.classList.add("fa-microphone")
  mute_unmute.classList.remove("mute")
  removeNameTagIcon(myDetails.id, "fa-microphone-slash")
  socket.emit('name-tag-removed', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-microphone-slash"})
}

const setMuteButton = () => {
  mute_unmute.classList.remove("fa-microphone")
  mute_unmute.classList.add("fa-microphone-slash")
  mute_unmute.classList.add("mute")
  addNameTagIcon(myDetails.id, "fa-microphone-slash")
  socket.emit('name-tag-added', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-microphone-slash"})
}

// PLAY - STOP
const play_stop = document.getElementsByClassName("play-stop")[0]

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

const setStopButton = () => {
  play_stop.classList.add("fa-video-slash")
  play_stop.classList.remove("fa-video")
  play_stop.classList.add("stop")
  addNameTagIcon(myDetails.id, "fa-video-slash")
  socket.emit('name-tag-added', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-video-slash"})
}

const setPlayButton = () => {
  play_stop.classList.remove("fa-video-slash")
  play_stop.classList.add("fa-video")
  play_stop.classList.remove("stop")
  removeNameTagIcon(myDetails.id, "fa-video-slash")
  socket.emit('name-tag-removed', {roomId: ROOM_ID, userId: myDetails.id, iconClass: "fa-video-slash"})
}


// ------------ ADDING ICON NEXT TO NAME TAG --------------------

const addNameTagIcon = (userId, iconClass) => {
  let name_tag = document.getElementsByClassName(userId)[0]
  let icon = document.createElement('i')
  icon.className = `name-tag-icon fas ${iconClass}`
  name_tag.append(icon)
}

const removeNameTagIcon = (userId, iconClass) => {
  let name_tag = document.getElementsByClassName(userId)[0]
  if(name_tag) {
    name_tag.getElementsByClassName(iconClass)[0].remove()
  }
}

socket.on('user-name-tag-added', data => {
  addNameTagIcon(data.userId, data.iconClass)
}) 


socket.on('user-name-tag-removed', data => {
  removeNameTagIcon(data.userId, data.iconClass)
}) 


//  ---------- CHAT ROOM ----------

const scrollToBottom = () => {
  let chat_window = $(".chat-window")
  chat_window.scrollTop(chat_window.prop("scrollHeight"))
}

const messages = document.getElementsByClassName("messages")[0]
let message = $("input")

// --------------------------------------------------------------------------------------------------------------
const getTime = () => {
  let today = new Date()
  let hours = today.getHours()
  let minutes = today.getMinutes()
  minutes = minutes < 10 ? '0' + minutes : minutes
  let currentTime = `${hours}:${minutes}`
  return currentTime
}

const createMessageWithName = (message, firstName, className) => {

  // outer div
  const div = document.createElement('div')
  div.className = className

  // firstName div
  let firstName_div = document.createElement('div')
  firstName_div.className = "row"

  let firstName_p = document.createElement('p')
  firstName_p.className = "firstName col-10"
  firstName_p.innerHTML = firstName

  let dash_p = document.createElement('p')
  dash_p.className = "col-2"
  dash_p.innerHTML = "==="
  

  // message div
  let message_div = document.createElement('div')
  message_div.className = "row"

  let message_p = document.createElement('p')
  message_p.className = "message col-10"
  message_p.innerHTML = message

  let time_p = document.createElement('p')
  time_p.className = "time col-2"
  time_p.innerHTML = getTime()


  firstName_div.append(firstName_p)
  firstName_div.append(dash_p)
  message_div.append(message_p)
  message_div.append(time_p)

  if(className == "user-message") {
    firstName_p.className += " order-last"
    message_p.className += " order-last"
  } 
  

  // appending everything to main div
  div.append(firstName_div)
  div.append(message_div)
  
  messages.append(div)
}

const createMessage = (message, firstName, className) => {

  let children = document.getElementsByClassName("messages")[0].children.length
  if(children != 0) {
    const latestFirstName = document.getElementsByClassName("messages")[0].lastChild.getElementsByClassName("firstName")[0]
    if(typeof latestFirstName !== 'undefined') {
      if(latestFirstName.innerHTML == firstName) {
        // message already send by this person, so omit name

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

// --------------------------------------------------------------------------------------------------------------



// SENDING MY MESSAGE
$("html").keydown(e => {
  if(e.which == 13 && message.val().length !== 0) {
    createMessage(message.val(), myDetails.firstName, "my-message")
    scrollToBottom()
    socket.emit('send-message', {roomId: ROOM_ID, message: message.val(), firstName: myDetails.firstName})
    message.val("")
  }
})

// RECEIBING USER'S MESSAGE
socket.on('receive-message', (data) => {
  createMessage(data.message, data.firstName, "user-message")
  scrollToBottom()
})

// toggle chat room visibility
const chat_section = document.getElementsByClassName("chat-section")[0]
const video_section = document.getElementsByClassName("video-section")[0]
let isShowingChat = true

const toggleChat = () => {

  if(isShowingParticipants) {
    isShowingParticipants = false
  }
    
  changeSections(participants_section, chat_section, isShowingChat)
  if(isShowingChat) {
    isShowingChat = false
  } else {
    isShowingChat = true
  }

};

// ---------- SHOW PARTICIPANTS ----------

const participants_div = document.getElementsByClassName("participants")[0]

const addParticipant = (participant, isMe = false) => {

  let fullName = `${participant.firstName} ${participant.lastName}`
  

  participants.push(participant)
  const p = document.createElement('p')
  p.id = participant.id
  p.innerHTML = fullName
  if(isMe) {
    p.innerHTML += " (You)"
  }
  participants_div.append(p)

  // console.log("------DEBUG-----------")
  // let name = document.getElementsByClassName(participant.id)[0]
  // console.log(name)
  // name.innerHTML = `${participant.firstName} ${participant.lastName}`

  


}

const removeParticipant = id => {
  const participant = document.getElementById(id)
  participant.remove()
}


// toggle participants part visibility
const participants_section = document.getElementsByClassName("participants-section")[0]
let isShowingParticipants = false

const toggleParticipants = () => {

  console.log("toggling participants....")

  if(isShowingChat) {
    isShowingChat = false
    chat_section.style.display = "none"
  }

  changeSections(chat_section, participants_section, isShowingParticipants)
  
  
  

  if(!isShowingParticipants) {
    isShowingParticipants = true
  } else {
    isShowingParticipants = false
  }

}

const changeSections = (sectionOne, sectionTwo, isShowingTwo) => {

  if(!isShowingTwo) {
    if(sectionOne.style.display == "block") {
      sectionOne.style.display = "none"
    } else {
      video_section.classList.remove("col-12")
      video_section.classList.add("col-9")
    }
    sectionTwo.style.display = "block"
  }

  else {
    video_section.classList.remove("col-9")
    video_section.classList.add("col-12")
    sectionTwo.style.display = "none"
  }
  

}













// ----------------- SCREEN SHARE -------------------


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







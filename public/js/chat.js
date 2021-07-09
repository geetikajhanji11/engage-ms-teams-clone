
const socket = io('/')

console.log(ROOM_ID)
const messages = document.getElementsByClassName("messages")[0]
let message = $("input")
let myDetails = {
    id: userId,
    firstName: firstName,
    lastName: lastName,
}

socket.emit('join-room', ROOM_ID, userId)



const scrollToBottom = () => {
    let chat_window = $(".chat-window")
    chat_window.scrollTop(chat_window.prop("scrollHeight"))
}

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

socket.on('user-disconnected', userId => {
    console.log(`${userId} has disconnected from chat........`)
})
# engage-ms-teams-clone



<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/geetikajhanji11/engage-ms-teams-clone">
    <img src="public/assets/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">MS Teams Clone</h3>

  <p align="center">
    A video conferencing web app that can be used to connect with people anyone, anywhere!
    <br />
    <br />
    <a href="TO BE SET">View Demo</a>
  </p>
</p>


<!-- ABOUT THE PROJECT -->
## About The Project
This project is a solution to the challenge posed by the Microsoft Engage 2021 Engagement & Mentorship Program for engineering students. The challenge was to build a fully functional prototype with at least one mandatory functionality - a minimum of two participants should be able connect with each other using your product to have a video conversation.

### Built With
* Express
* Bootstrap
* JQuery
* SocketIO
* Peerjs

### Features:
* Unique Room Creations
* Mutiple Participant Connectivity
* Video ON / OFF
* Mute / Unmute
* Chatroom During Call
* Show list of all Participants

![project-image](public/assets/home.png)

## Code Overview

### Dependencies

* [express](https://github.com/expressjs/express) - The server for handling and routing HTTP requests.
* [peer](https://peerjs.com/) - The PeerServer for establishing connections between PeerJS clients.
* [socket.io](https://socket.io/docs/v4/index.html) - For enabling real-time bidirectional event-based communication among the peers.
* [ejs](https://ejs.co/) - For creating the website's frontend.
* [uuid](https://www.npmjs.com/package/uuid?activeTab=readme) - For generating random unique roomID's

### Application Structure

* `server.js` - This file defines our express server.
* `public/` - This folder contains all the static files.
  *  `assets/` - Contains all the images used in the website.
  *  `css/` - Contains all the css files.
  *  `js/` - Contains all the javascript files for the project.
* `views/` - This folder contains all the ejs files that need to be rendered.


<!-- GETTING STARTED -->
## Getting Started

Here are the instructions on setting up the project locally.
To get a local copy up and running, follow these steps.

### Prerequisites

First, you need to download and install node.js and npm.
* Download Node.js using this link.
  ```sh
  https://nodejs.org/en/download/
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/geetikajhanji11/engage-ms-teams-clone.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Run the app locally
   ```JS
   npm run devStart
   ```
4. Go to this url
   ```JS
   http://localhost:3000/
   ```




<!-- USAGE EXAMPLES -->
## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_



<!-- CONTACT -->
## Contact

Your Name - [@your_twitter](https://twitter.com/your_username) - email@example.com

Project Link: [https://github.com/your_username/repo_name](https://github.com/your_username/repo_name)


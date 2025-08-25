# HPEChat

<img width="1920" height="927" alt="login" src="https://github.com/user-attachments/assets/bc24ddbd-1836-4fe3-af10-e5861561b99a" />

## About

> [!NOTE]  
> This project is still in development and not all components are done yet.

**Messenging app for you and your friends**

The idea behind this app was to develop a modern looking text communicator that can be hosted on a private server without any issues and additional costs. As an owner you can control who uses your app and also have complete control over data that users share.

This repository contains both server and client related files, which should let you host your own instance of this application.

## Features

### As an user:
* Create, join and manage servers
* Moderate servers as an owner
* Each server can consist of multiple channels
* Spice up your server with custom descriptions and icons
* Attach files to your messages
* Send private messages to other users

### As an owner:
* Create and delete user accounts
* Nuke entire database in case of breach

### System features:
* Real-time communication achieved with SignalR
* Light & Dark Mode

## Tech Stack
Server: .NET 9.0, Entity Framework Core, SignalR  
Database: MS SQL  
Client: React 19, Zustand, TailwindCSS, shadcn/ui  

## Screenshots

<img width="1920" height="927" alt="server" src="https://github.com/user-attachments/assets/2441d2b5-aafa-47ee-8c52-7d55dd0b0572" />

<img width="1920" height="927" alt="settings" src="https://github.com/user-attachments/assets/dce10492-1512-4635-b06b-6a7324b856e6" />

<img width="1920" height="927" alt="create-server-modal" src="https://github.com/user-attachments/assets/77149f95-a65c-4dca-b13f-8e0b28ffd12e" />

## Todo List

### Server
- [X] Creating server
- [X] Joining server
- [X] Leaving server
- [ ] Edititing server (frontend not done)
- [X] Displaying list of servers
- [X] Displaying server info
- [ ] Deleting server

### Channel
- [X] Creating channel
- [X] Editing channel
- [X] Deleting channel
- [X] Displaying channel info

### Server Messages
- [X] Sending messages
- [X] Attaching files to messages
- [X] Editing messages
- [X] Deleting messages
- [ ] Who is writing?
- [ ] Embedding URLs

### Private Messages
- [ ] Displaying user list
- [ ] Sending messages
- [ ] Attaching files to messages
- [ ] Editing messages
- [ ] Deleting messages
- [ ] Who is writing?
- [ ] Embedding URLs

### User
- [X] Registering user
- [X] User login
- [X] User logout
- [X] Editing user info
- [X] Password change
- [ ] Granting admin privileges (frontend not done)
- [ ] Revoking admin privileges (frontend not done)
- [ ] User status

### Other
- [X] Refactoring app store
- [ ] Better lazy load for images
- [ ] Mobile support
- [ ] Finishing this list
- [ ] Finishing this README
- [ ] Localizing app
- [ ] Tests

## Contributing

Wanna help or report an issue? Feel free to do so!

## Made by

Piotr Radziszewski  

*MyPHPoL™ 2025*

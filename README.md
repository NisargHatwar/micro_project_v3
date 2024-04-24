# Smart Switch

## Introduction
Smart Switch is a web-based control system designed to enable users to remotely control switches from anywhere with an internet connection. This project forms part of a larger endeavor aimed at facilitating home and industrial automation.

## How It Works
The system consists of a server hosted on render.com, which serves as the central hub for switch control. Users interact with the system through a web interface built using Node.js and Express. Upon logging in, users gain access to various functionalities, including switch state control, profile management, and more.

The switch control data is communicated to an ESP8266-01 module, which in turn communicates with an Arduino Uno via serial communication. The Arduino Uno interprets the data and controls the switches accordingly.

## Technologies Used
- Node.js
- Express

## Pages
1. **Home Page**: Landing page providing an overview of the system.
2. **Login Page**: Allows users to log in to their accounts.
3. **Signup Page**: Enables new users to create accounts.
4. **Edit Page**: Allows users to modify their profile information.
5. **Remote Page**: Provides controls for switching states remotely.
6. **Profile Page**: Allows users to manage their account settings.

## Getting Started
To get started with Smart Switch, follow these steps:
1. Clone the repository.
2. Install dependencies using `npm install`.
3. Configure the server settings as per your requirements.
4. Run the server using `node server.js`.
5. Access the website through your preferred web browser.

## Usage
- Access the home page to get an overview of the system.
- Sign up for a new account or log in if you already have one.
- Use the remote page to control switch states remotely.
- Access the profile page to manage your account settings.

## API Endpoints
- **GET /api/:uname/:pass**: Retrieves switch states for a given username and password.
- **POST /api/swcontrol**: Updates switch control settings.

## Contributors
- Nisarg Hatwar(https://github.com/NisargHatwar)

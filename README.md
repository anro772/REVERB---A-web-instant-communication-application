# REVERB Instant Communication Application

REVERB is an instant communication application designed to provide users with seamless messaging experiences. Built with .NET Core for the backend and Angular for the frontend, REVERB offers a robust, scalable, and modern platform for real-time communication.

Features
- Real-time Messaging: Instantly send and receive messages with real-time updates.
- User Authentication: Secure login and registration system.
- Contact List: Manage your contacts and chat sessions.
- Message History: Access your past conversations anytime.
- Notifications: Receive notifications for new messages and other important events.
- Video call and screen sharing functionality.
- Group chat functionality.

# Prerequisites

- [.NET Core SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/en/download/)
- [MySQL](https://www.mysql.com/downloads/) Used as the database server. Ensure you have MySQL installed and running on your machine.

# Getting Started

1. Clone the repository
```sh
git clone
```

2. Navigate to the server directory
```sh
cd server
```

3. Install the server dependencies
```sh
dotnet restore
```

4. Ensure the connection string in appsettings.json (or appsettingsdevelopment.json for development) is correctly configured to point to your MySQL server.

5. Update or create the database schema using Entity Framework migrations. First, apply migrations to update or create the database automatically.
```sh
dotnet ef migrations add InitialCreate
dotnet ef database update
```

6. Run the server
```sh
dotnet run
```

7. Navigate to the client directory
```sh
cd ../client
```

8. Install the client dependencies
```sh
npm install
```

9. Run the client
```sh
npm start
```

10. Open your browser and navigate to http://localhost:4200

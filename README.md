# File Watcher

File Watcher is a simple application that watches for new files in a folder and sends them to a remote server to be available to remote clients. The application uses Docker Compose to run the server and client applications.


## Getting Started

To get started with File Watcher, you will need to have Docker installed on your system. Once Docker is installed, you can use the following command to start the server:

```shell
docker-compose up -d
```

This command will run the application from a docker container and leave it running in the background.

## Clients

To exchange data between clients, you will need to create a shared folder on each client machine. You can do this by running the following command:

```shell
mkdir -p /share/client_A_share_folder
```

Replace **client_A** with the name of your client.

Once the shared folder is created, you will need to run the following command on each client machine:


```shell
Copy Code
deno run --allow-read --allow-net --allow-write main.ts \
  --url="http://file-share-ip:8081" \
  --inPath="/share/client_A_share_folder"
```

Replace **client_A** with the name of your client, and file-share-ip with the IP address of the server.

This command will start the client application and connect it to the shared folder on the server. Any files added to the shared folder will be sent to the remote clients.


# Security Considerations

File Watcher does not implement any security measures to protect the data being transferred between clients. It is important to use this application in a secure environment and to ensure that only authorized users have access to the shared folders.
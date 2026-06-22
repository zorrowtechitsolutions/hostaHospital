import { io } from "socket.io-client";

export const socket = io("http://35.174.10.32", {
  transports: ["websocket"],
  autoConnect: true,
});

console.log(socket,"hii");

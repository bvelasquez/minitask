import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Task, Note } from '../types';

interface SocketEvents {
  taskAdded: (task: Task) => void;
  taskUpdated: (task: Task) => void;
  taskDeleted: (taskId: number) => void;
  tasksReordered: (taskIds: number[]) => void;
  noteAdded: (note: Note) => void;
  noteUpdated: (note: Note) => void;
  noteDeleted: (noteId: number) => void;
}

export const useSocket = (events: Partial<SocketEvents>) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io();

    const socket = socketRef.current;

    // Set up event listeners
    if (events.taskAdded) socket.on('taskAdded', events.taskAdded);
    if (events.taskUpdated) socket.on('taskUpdated', events.taskUpdated);
    if (events.taskDeleted) socket.on('taskDeleted', events.taskDeleted);
    if (events.tasksReordered) socket.on('tasksReordered', events.tasksReordered);
    if (events.noteAdded) socket.on('noteAdded', events.noteAdded);
    if (events.noteUpdated) socket.on('noteUpdated', events.noteUpdated);
    if (events.noteDeleted) socket.on('noteDeleted', events.noteDeleted);

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef.current;
};
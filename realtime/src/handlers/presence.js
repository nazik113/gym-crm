export const setupPresenceHandlers = (io, socket) => {
  // Broadcast gym presence to admin room when someone enters/leaves
  socket.on('presence:request_list', async () => {
    if (!['admin', 'trainer'].includes(socket.user.role)) return;
    socket.emit('presence:list_requested', { timestamp: new Date() });
  });

  // Admin manually updates presence
  socket.on('presence:manual_enter', ({ clientId }) => {
    if (socket.user.role !== 'admin') return;
    io.to('role:admin').emit('presence:client_entered', {
      clientId,
      enteredAt: new Date(),
      method: 'manual',
      markedBy: socket.user.name,
    });
  });

  socket.on('presence:manual_leave', ({ clientId, duration }) => {
    if (socket.user.role !== 'admin') return;
    io.to('role:admin').emit('presence:client_left', {
      clientId,
      leftAt: new Date(),
      duration,
    });
  });
};

export const setupNotificationHandlers = (io, socket) => {
  socket.on('notification:mark_read', ({ notificationId }) => {
    // Acknowledge to user's own room
    socket.emit('notification:marked_read', { notificationId });
  });

  // Broadcast subscription expiry warning to specific user
  socket.on('admin:notify_user', ({ userId, message, type }) => {
    if (socket.user.role !== 'admin') return;
    io.to(`user:${userId}`).emit('notification:received', {
      message, type, timestamp: new Date(),
    });
  });
};

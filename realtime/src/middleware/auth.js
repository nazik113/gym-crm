import jwt from 'jsonwebtoken';
import axios from 'axios';

export const authMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) return next(new Error('Authentication required'));

    // Verify with backend
    const { data } = await axios.get(`${process.env.BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });

    socket.user = {
      id:    data.id,
      role:  data.role?.name,
      name:  `${data.first_name} ${data.last_name}`,
      token,
    };

    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
};

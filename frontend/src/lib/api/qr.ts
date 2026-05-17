import api from './client'

export const qrApi = {
  myQR: () => api.get('/qr/my'),
  scan: (qrCode: string) => api.post('/qr/scan', { qr_code: qrCode }),
}

/**
 * AmoebaTalk integration configuration
 * Reads from environment variables
 */
export const getAmoebaTalkConfig = () => ({
  sharedSecret: process.env.AMB_ATK_SHARED_SECRET || '',
  connectUrl: process.env.AMB_ATK_CONNECT_URL || 'http://localhost:3002/auth/amb-connect',
  apiUrl: process.env.AMB_ATK_API_URL || 'http://localhost:3000/api',
  apiKey: process.env.AMB_ATK_API_KEY || '',
})

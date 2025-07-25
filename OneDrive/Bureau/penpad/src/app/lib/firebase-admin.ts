import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { Agent } from 'http'

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
}

// Create custom HTTP agent that forces IPv4
const ipv4Agent = new Agent({
  family: 4, // Force IPv4
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 10,
  maxFreeSockets: 10,
  timeout: 60000,
})

// Initialize Firebase Admin
const apps = getApps()

if (!apps.length) {
  initializeApp({
    credential: cert(firebaseAdminConfig),
    // Force IPv4 to avoid IPv6 connectivity issues
    httpAgent: ipv4Agent,
  })
}

// Initialize Firebase Admin services
export const adminAuth = getAuth()
export const adminDb = getFirestore()

export default apps[0] 
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA1n1-nAim-w6Axd7MfaKhh285aZWg65PE',
  authDomain: 'plandaccion-ce73e.firebaseapp.com',
  projectId: 'plandaccion-ce73e',
  storageBucket: 'plandaccion-ce73e.firebasestorage.app',
  messagingSenderId: '811976851310',
  appId: '1:811976851310:web:4908d16e95ed0b71c68b7f',
  measurementId: 'G-NY5B2SN7B4',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

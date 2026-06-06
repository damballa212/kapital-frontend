import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import { FIREBASE_CONFIG } from './config.js'

firebase.initializeApp(FIREBASE_CONFIG)

export default firebase

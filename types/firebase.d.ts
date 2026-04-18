declare module '#app' {
  interface NuxtApp {
    $firebaseAuth: import('firebase/auth').Auth
    $firebaseDb: import('firebase/firestore').Firestore
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $firebaseAuth: import('firebase/auth').Auth
    $firebaseDb: import('firebase/firestore').Firestore
  }
}

export {}

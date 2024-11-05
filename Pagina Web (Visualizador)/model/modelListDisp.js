import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, addDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA7M2fuyG3owV9dWM706YMJnqQ9Jbe6DSo",
    authDomain: "teste-7fa12.firebaseapp.com",
    databaseURL: "https://teste-7fa12-default-rtdb.firebaseio.com",
    projectId: "teste-7fa12",
    storageBucket: "teste-7fa12.appspot.com",
    messagingSenderId: "340432857585",
    appId: "1:340432857585:web:58169c01b8eaa901dafc50",
    measurementId: "G-ZB0X9DV029",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch sensor details based on provided IDs
export async function fetchSensorDetails(sensorIds, field) {
    const promises = sensorIds.map(async id => {
        const sensorDoc = await getDoc(doc(db, "sensores", id));
        return sensorDoc.exists() ? sensorDoc.data()[field] : null;
    });
    return Promise.all(promises);
}

// Fetch and render devices in real-time
export function fetchData(callback) {
    const estacoesRef = collection(db, "dispositivos");
    onSnapshot(estacoesRef, async (snapshot) => {
        callback(snapshot);
    });
}

// Add new device
export async function addDevice(data) {
    await addDoc(collection(db, "dispositivos"), data);
}

// Fetch all sensors
export async function fetchAllSensors() {
    const sensoresRef = collection(db, "sensores");
    const querySnapshot = await getDocs(sensoresRef);
    return querySnapshot.docs.map(doc => doc.id);
}

// Fetch collection
export async function fetchColecao(){
    return collection(db, "dispositivos");
}

// Fetch getDocs
export async function fetchGetDocs(estacoesRef) {
    return getDocs(estacoesRef);
}
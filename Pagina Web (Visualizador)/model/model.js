import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, addDoc, getDocs, onSnapshot, query, where, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns';

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch device details
export async function fetchDevice(estacao) {
    const dispositivoSnap = await getDoc(doc(db, "dispositivos", estacao));
    if (dispositivoSnap.exists()) {
        return { id: dispositivoSnap.id, ...dispositivoSnap.data() };
    } else {
        throw new Error('Nenhum dispositivo encontrado.');
    }
}

// Update device
export async function updateDevice(estacao, updateFields) {
    console.log("ola update");
    await updateDoc(doc(db, "dispositivos", estacao), updateFields);
    window.location.reload();
}

// Delete device
export async function deleteDevice(estacao) {
    await deleteDoc(doc(db, "dispositivos", estacao));
    window.location.href = "listEstacaoTeste.html";
}

// Fetch measurements for a device
export async function fetchMeasurements(estacao) {
    const medicoesEstacao = query(collection(db, 'medicoes'), where('dispositivo_id', '==', estacao));
    const querySnapshot = await getDocs(medicoesEstacao);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Fetch all sensors
export async function fetchAllSensors() {
    const sensoresRef = collection(db, "sensores");
    const querySnapshot = await getDocs(sensoresRef);
    return querySnapshot.docs.map(doc => doc.id);
}

// Fetch chart data for a device
export async function fetchChartData(estacao) {
    const medicoesEstacao = query(collection(db, 'medicoes'), where('dispositivo_id', '==', estacao));
    const querySnapshot = await getDocs(medicoesEstacao);

    if (querySnapshot.empty) {
        throw new Error("Nenhuma medição encontrada.");
    }

    const allMeasurements = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        allMeasurements.push({
            dthr: new Date(data.dthr),
            sensor_id: data.sensor_id,
            valor: data.valor
        });
    });

    // Ordena as medições por data e hora
    allMeasurements.sort((a, b) => a.dthr - b.dthr);

    const sensorData = {};
    const timeData = [];

    allMeasurements.forEach(measurement => {
        const { dthr, sensor_id, valor } = measurement;

        if (!timeData.includes(dthr)) {
            timeData.push(dthr);
        }

        if (!sensorData[sensor_id]) {
            sensorData[sensor_id] = new Array(timeData.length).fill(null);
        }

        const index = timeData.indexOf(dthr);
        if (index !== -1) {
            sensorData[sensor_id][index] = valor;
        }
    });

    return { sensorData, timeData };
}

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

// Fetch collection of devices
export async function fetchColecao() {
    return collection(db, "dispositivos");
}

// Fetch getDocs
export async function fetchGetDocs(estacoesRef) {
    return getDocs(estacoesRef);
}
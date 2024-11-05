// Import the necessary functions from Firebase SDK
import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
    getAnalytics 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    addDoc, 
    getDocs, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Fetch sensor details based on provided IDs
async function fetchSensorDetails(sensorIds, field) {
    const promises = sensorIds.map(async id => {
        const sensorDoc = await getDoc(doc(db, "sensores", id));
        return sensorDoc.exists() ? sensorDoc.data()[field] : null;
    });
    return Promise.all(promises);
}

// Fetch and render devices in real-time
async function fetchData() {
    const estacoesRef = collection(db, "dispositivos");
    onSnapshot(estacoesRef, async (snapshot) => {
        const cardsContainer = document.getElementById("cardsEstacoes");
        cardsContainer.innerHTML = snapshot.empty ? "<p>Nenhum dispositivo encontrado.</p>" : "";

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const { nome, descricao, dthr_instalacao, dthr_ult_conexao, lista_sensores: listaSensoresIDs, status, tipo_dispositivo } = data;

            const dthrInstalacao = dthr_instalacao.toDate().toLocaleString();
            const dthrUltConexao = dthr_ult_conexao ? new Date(dthr_ult_conexao).toLocaleString() : "Data desconhecida";

            const sensoresNomes = await fetchSensorDetails(listaSensoresIDs, 'grandeza_mensurada');

            cardsContainer.innerHTML += createCardHTML({ nome, descricao, dthrInstalacao, dthrUltConexao, sensoresNomes, status, tipo_dispositivo, dispositivoID: doc.id });
        }
    });
}

// Create HTML for device card
function createCardHTML({ nome, descricao, dthrInstalacao, dthrUltConexao, sensoresNomes, status, tipo_dispositivo, dispositivoID }) {
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title text-center mb-4"><strong>${"Dispositivo " + nome}</strong></h5>
                    <p class="card-text"><strong>Descrição:</strong> ${descricao || "Não tem descrição"}</p>
                    <p class="card-text"><strong>Data e Hora da Instalação:</strong> ${dthrInstalacao}</p>
                    <p class="card-text"><strong>Data e Hora da Última Conexão:</strong> ${dthrUltConexao}</p>
                    <p class="card-text"><strong>Lista de Sensores:</strong> ${sensoresNomes.length > 0 ? sensoresNomes.join(', ') : "Não possui sensores"}</p>
                    <p class="card-text"><strong>Status:</strong> ${status || "Desconhecido"}</p>
                    <p class="card-text"><strong>Tipo de Dispositivo:</strong> ${tipo_dispositivo || "Desconhecido"}</p>
                    <a href="firestoredatabase.html?estacao=${dispositivoID}" class="btn d-flex btn-success justify-content-center align-items-center">Ver Detalhes <i class="bi bi-eye" style="margin-left: 8px;"></i></a>
                </div>
            </div>
        </div>
    `;
}

// Search functionality
document.getElementById("searchForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const searchValue = document.getElementById("searchInput").value.trim().toLowerCase();
    if (searchValue) await searchInFirebase(searchValue);
    document.getElementById("searchInput").value = "";
});

async function searchInFirebase(searchValue) {
    const estacoesRef = collection(db, "dispositivos");
    const snapshot = await getDocs(estacoesRef);
    const cardsContainer = document.getElementById("cardsEstacoes");
    cardsContainer.innerHTML = "";

    const resultadosExibidos = new Set();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const { nome, descricao, end_mac, status, localizacao, lista_sensores: listaSensoresIDs, tipo_dispositivo } = data;
        const dispositivoID = doc.id;

        const listaID = await fetchSensorDetails(listaSensoresIDs, 'sensor_id');
        const listaSensoresIDString = await fetchSensorDetails(listaSensoresIDs, 'grandeza_mensurada');

        if (isSearchMatch({ dispositivoID, localizacao, nome, end_mac, status, searchValue, listaID })) {
            if (!resultadosExibidos.has(dispositivoID)) {
                resultadosExibidos.add(dispositivoID);
                cardsContainer.innerHTML += createCardHTML({ nome, descricao, dthrInstalacao: "", dthrUltConexao: "", sensoresNomes: listaSensoresIDString, status, tipo_dispositivo, dispositivoID });
            }
        }
    }

    if (resultadosExibidos.size === 0) {
        cardsContainer.innerHTML = "<h2 class='text-center'>Nenhum dispositivo encontrado.</h2>";
    }
}

// Check if search matches
function isSearchMatch({ dispositivoID, localizacao, nome, end_mac, status, searchValue, listaID }) {
    return (
        dispositivoID.toLowerCase().includes(searchValue) ||
        localizacao.toLowerCase().includes(searchValue) ||
        nome.toLowerCase().includes(searchValue) ||
        end_mac.toLowerCase().includes(searchValue) ||
        status.toLowerCase().includes(searchValue) ||
        listaID.some(sensor => sensor.includes(searchValue))
    );
}

// Fetch all sensors for displaying in the registration form
async function fetchAllSensors() {
    const sensoresRef = collection(db, "sensores");
    const querySnapshot = await getDocs(sensoresRef);
    return querySnapshot.docs.map(doc => doc.id);
}

// Handle device registration
document.getElementById("btnCadastrar").addEventListener("click", async () => {
    const data = {
        nome: document.getElementById("nomeDispositivo").value,
        descricao: document.getElementById("descricaoDispositivo").value,
        localizacao: document.getElementById("localizacao").value,
        status: document.getElementById("status").value,
        tipo_dispositivo: document.getElementById("tipoDispositivo").value,
        lista_sensores: Array.from(document.querySelectorAll('input[name="sensor"]:checked')).map(input => input.value),
        dthr_instalacao: new Date(document.getElementById("dthr_Instalacao").value),
        dthr_ult_conexao: "",
        end_mac: ''
    };

    try {
        await addDoc(collection(db, "dispositivos"), data);
        alert("Dispositivo cadastrado com sucesso!");
        document.getElementById("formCadastrarDispositivo").reset();
    } catch (error) {
        console.error("Error adding document: ", error);
    }
});

// Load sensors into the registration form
async function carregarSensores() {
    const sensores = await fetchAllSensors();
    const listaSensoresElement = document.getElementById('listaSensores');

    sensores.forEach(sensor => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" name="sensor" value="${sensor}" id="${sensor}">
            <label for="${sensor}">${sensor}</label>
        `;
        listaSensoresElement.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    carregarSensores();
    fetchData();
});
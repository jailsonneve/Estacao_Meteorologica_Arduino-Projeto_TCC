import { fetchSensorDetails, fetchData, addDevice, fetchAllSensors, fetchColecao, fetchGetDocs } from '../model/modelListDisp.js';
import { createCardHTML, showAlert } from '../view/viewListDisp.js';

// Fetch and render devices in real-time
function renderDevices(snapshot) {
    const cardsContainer = document.getElementById("cardsEstacoes");
    cardsContainer.innerHTML = snapshot.empty ? "<p>Nenhum dispositivo encontrado.</p>" : "";

    snapshot.docs.forEach(async (doc) => {
        const data = doc.data();
        const { nome, descricao, dthr_instalacao, dthr_ult_conexao, lista_sensores: listaSensoresIDs, status, tipo_dispositivo } = data;

        const dthrInstalacao = dthr_instalacao.toDate().toLocaleString();
        const dthrUltConexao = dthr_ult_conexao ? new Date(dthr_ult_conexao).toLocaleString() : "Data desconhecida";

        const sensoresNomes = await fetchSensorDetails(listaSensoresIDs, 'grandeza_mensurada');

        cardsContainer.innerHTML += createCardHTML({ nome, descricao, dthrInstalacao, dthrUltConexao, sensoresNomes, status, tipo_dispositivo, dispositivoID: doc.id });
    });
}

// Search functionality
document.getElementById("searchForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const searchValue = document.getElementById("searchInput").value.trim().toLowerCase();
    if (searchValue) await searchInFirebase(searchValue);
    document.getElementById("searchInput").value = "";
});

async function searchInFirebase(searchValue) {
    const estacoesRef = await fetchColecao();
    const snapshot = await fetchGetDocs(estacoesRef);
    const cardsContainer = document.getElementById("cardsEstacoes");
    cardsContainer.innerHTML = "";

    const resultadosExibidos = new Set();

    snapshot.docs.forEach(async (doc) => {
        const data = doc.data();
        const { nome, descricao, end_mac, status, localizacao, lista_sensores: listaSensoresIDs, tipo_dispositivo } = data;
        const dispositivoID = doc.id;
        const listaSensoresIDString = await fetchSensorDetails(listaSensoresIDs, 'grandeza_mensurada');

        if (isSearchMatch({ dispositivoID, localizacao, nome, end_mac, status, listaSensoresIDs, searchValue })) {
            if (!resultadosExibidos.has(dispositivoID)) {
                resultadosExibidos.add(dispositivoID);
                cardsContainer.innerHTML += createCardHTML({ nome, descricao, dthrInstalacao: "", dthrUltConexao: "", sensoresNomes: listaSensoresIDString, status, tipo_dispositivo, dispositivoID });
            }
        }
    });

    if (resultadosExibidos.size == 0) {
        cardsContainer.innerHTML = "<h2 class='text-center'>Nenhum dispositivo encontrado.</h2>";
    }
}

// Check if search matches
function isSearchMatch({ dispositivoID, localizacao, nome, end_mac, status, listaSensoresIDs, searchValue }) {
    return (
        dispositivoID.toLowerCase().includes(searchValue) ||
        localizacao.toLowerCase().includes(searchValue) ||
        nome.toLowerCase().includes(searchValue) ||
        end_mac.toLowerCase().includes(searchValue) ||
        status.toLowerCase().includes(searchValue) ||
        listaSensoresIDs.some(sensor => sensor.includes(searchValue))
    );
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
        await addDevice(data);
        showAlert("Dispositivo cadastrado com sucesso!");
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
    fetchData(renderDevices);
});

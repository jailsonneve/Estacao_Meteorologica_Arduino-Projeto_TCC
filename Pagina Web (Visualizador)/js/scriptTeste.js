// Importar as funções necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, query, where, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns';

// Configuração do Firebase
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variáveis para armazenar os dados do gráfico
let sensorData = {}; // Objeto para armazenar os valores dos sensores
let timeData = [];   // Array para armazenar as datas/hora das medições

const estacao = getEstacaoId();

async function delMedi(estacao) {
    const medicoesEstacao = query(collection(db, 'medicoes'), where('nome', '==', estacao));
    const querySnapshot = await getDocs(medicoesEstacao);

    if (!querySnapshot.empty) {
        await Promise.all(querySnapshot.docs.map(doc => deleteDoc(doc.ref)));
        console.log("Medições deletadas com sucesso.");
    } else {
        console.log("Nenhuma medição encontrada para deletar.");
    }
}

async function delDisp() {
    try {
        await delMedi(estacao);
        await deleteDoc(doc(db, "dispositivos", estacao));
        alert("Dispositivo e medições deletados com sucesso!");
        window.location.href = "listEstacaoTeste.html";
    } catch (error) {
        console.error("Erro ao deletar dispositivo: ", error);
    }
}

async function salvarAlteracao() {
    const updateFields = {
        nome: document.getElementById("nomeDispositivo").value,
        descricao: document.getElementById("descricaoDispositivo").value,
        localizacao: document.getElementById("localizacao").value,
        status: document.getElementById("status").value,
        tipo_dispositivo: document.getElementById("tipoDispositivo").value,
        lista_sensores: Array.from(document.querySelectorAll('input[name="sensor"]:checked')).map(cb => cb.value)
    };
    
    try {
        await updateDoc(doc(db, "dispositivos", estacao), updateFields);
        alert("Alterações salvas com sucesso!");
        window.location.reload();
    } catch (error) {
        console.error("Erro ao salvar alterações: ", error);
    }
}

// Na função fetchDevice, obtenha o estacaoId
async function fetchDevice() {
    const dispositivoSnap = await getDoc(doc(db, "dispositivos", estacao));

    if (dispositivoSnap.exists()) {
        const dispositivoData = dispositivoSnap.data();
        displayDeviceInfo(dispositivoData, estacao); // Passando o estacaoId
        return dispositivoData.lista_sensores || [];
    } else {
        alert('Nenhum dispositivo encontrado.');
        console.log('Nenhum dispositivo encontrado.');
        window.location.href = "listEstacaoTeste.html";
        return [];
    }
}

function capitalizeFirstLetter(string) {
    return string ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : '';
}

async function fetchSensoresNomes(sensorIds) {
    const sensoresNomes = await Promise.all(sensorIds.map(async (id) => {
        const sensorDoc = await getDoc(doc(db, "sensores", id));
        return sensorDoc.exists() ? `${sensorDoc.data().grandeza_mensurada} (${sensorDoc.data().modelo_sensor})` : null;
    }));
    return sensoresNomes.filter(Boolean);
}

async function displayDeviceInfo(data) {
    const listaSensoresIDs = data.lista_sensores || [];
    const sensoresNomes = await fetchSensoresNomes(listaSensoresIDs);
    const todosSensores = await fetchAllSensors(); // Busca todos os sensores cadastrados

    const infoContainer = document.getElementById('info');
    infoContainer.innerHTML = ''; 

    const section = `
    <section class="mb-4">
        <div class="card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="tituloCard card-title mb-0 text-center flex-grow-1">${capitalizeFirstLetter(data.nome)}</h5>
                    <div>
                        <button class="btn btn-sm btn-primary me-2" data-bs-toggle="modal" data-bs-target="#editarDispositivo">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#deletarDispositivo">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </div>
                ${createDeviceDetails(data, sensoresNomes, estacao)}
            </div>
        </div>
    </section>
    ${createModals(data, todosSensores)}
    `;

    infoContainer.innerHTML += section;
    document.getElementById('btnSalvar').addEventListener('click', salvarAlteracao);
    document.getElementById('btnConfirmar').addEventListener('click', delDisp);
}

function createDeviceDetails(data, sensoresNomes, estacaoId) {
    const dthrIntalacao = data.dthr_instalacao.toDate().toLocaleString();
    const dthrUltConexao = data.dthr_ult_conexao ? new Date(data.dthr_ult_conexao).toLocaleString() : "Data desconhecida";
    return `
        <p class="card-text">Descrição: ${data.descricao || "Não tem descrição"}</p>
        <p class="card-text">ID do Dispositivo: ${estacaoId || "Não foi possível adquirir o ID"}</p>
        <p class="card-text">Data e Hora da Instalação: ${dthrIntalacao || "Data desconhecida"}</p>
        <p class="card-text">Data e Hora da Última Conexão: ${dthrUltConexao}</p>
        <p class="card-text">Endereço MAC: ${data.end_mac || "Não foi possível obter"}</p>
        <p class="card-text">Lista de Sensores: ${sensoresNomes.length > 0 ? sensoresNomes.join(', ') : "Não possui sensores"}</p>
        <p class="card-text">Localização: ${data.localizacao || "Desconhecida"}</p>
        <p class="card-text">Status: ${data.status || "Desconhecido"}</p>
        <p class="card-text">Tipo de Dispositivo: ${data.tipo_dispositivo || "Desconhecido"}</p>
    `;
}

function createModals(data, todosSensores) {
    const nome = capitalizeFirstLetter(data.nome);
    return `
    <section>
        <div class="modal fade" id="editarDispositivo" tabindex="-1" aria-labelledby="editarDispositivo" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5 text-center w-100" id="editarDispositivo">${nome}</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="descricaoModal">
                            ${createModalForm(data, todosSensores)}
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button id="btnSalvar" type="submit" class="btn btn-success" data-bs-dismiss="modal">Salvar Alterações</button>
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <section>
        <div class="modal fade" id="deletarDispositivo" tabindex="-1" aria-labelledby="deletarDispositivo" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5 text-center w-100" id="deletarDispositivo">Apagar o Dispositivo: ${nome}</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        Você tem certeza que deseja apagar o dispositivo ${nome.bold()}?
                        <p>Esta ação ${"NÃO".bold()} poderá ser desfeita.</p>
                    </div>
                    <div class="modal-footer">
                        <button id="btnConfirmar" type="submit" class="btn btn-success" data-bs-dismiss="modal">Sim, eu tenho</button>
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    </section>
    `;
}

function createModalForm(data, todosSensores) {
    return `
        <div class="mb-3">
            <label for="nomeDispositivo" class="form-label">Nome do Dispositivo</label>
            <input type="text" class="form-control" id="nomeDispositivo" value="${data.nome}">
        </div>
        <div class="mb-3">
            <label for="descricaoDispositivo" class="form-label">Descrição do Dispositivo</label>
            <textarea class="form-control" id="descricaoDispositivo">${data.descricao || ""}</textarea>
        </div>
        <div class="mb-3">
            <label for="localizacao" class="form-label">Localização</label>
            <input type="text" class="form-control" id="localizacao" value="${data.localizacao || ""}">
        </div>
        <div class="mb-3">
            <label for="status" class="form-label">Status</label>
            <input type="text" class="form-control" id="status" value="${data.status || ""}">
        </div>
        <div class="mb-3">
            <label for="tipoDispositivo" class="form-label">Tipo do Dispositivo</label>
            <input type="text" class="form-control" id="tipoDispositivo" value="${data.tipo_dispositivo || ""}">
        </div>
        <fieldset class="mb-3">
            <legend>Sensores</legend>
            ${todosSensores.map(sensor => `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="sensor" value="${sensor}" ${data.lista_sensores.includes(sensor) ? 'checked' : ''}>
                    <label class="form-check-label">${sensor}</label>
                </div>
            `).join('')}
        </fieldset>
    `;
}

async function fetchMeasurements() {
    const listaSensores = await fetchDevice();

    if (listaSensores.length === 0) {
        document.getElementById("saida").textContent = "Nenhuma medição encontrada para este dispositivo.";
        return;
    }

    const medicoesEstacao = query(collection(db, 'medicoes'), where('dispositivo_id', '==', estacao));
    const querySnapshot = await getDocs(medicoesEstacao);

    if (querySnapshot.empty) {
        document.getElementById("saida").textContent = "Nenhuma medição encontrada para este dispositivo.";
        return;
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

    allMeasurements.sort((a, b) => a.dthr - b.dthr);

    sensorData = {};
    timeData = [];

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

    createChart(listaSensores);
}

function createChart(listaSensores) {
    const ctx = document.getElementById('myChart').getContext('2d');

    const datasets = listaSensores.map(sensor => ({
        label: sensor,
        data: sensorData[sensor],
        borderColor: getRandomColor(),
        fill: false,
        tension: 0.2,
        spanGaps: true,
    }));

    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeData,
            datasets: datasets,
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'MMM d, HH:mm',
                            day: 'MMM d',
                        },
                    },
                    title: {
                        display: true,
                        text: 'Data e Hora',
                    }
                },
                y: {
                    type: 'logarithmic',
                    ticks: {
                        font: {
                            size: 15
                        },
                        autoSkip: true,
                        maxTicksLimit: 5
                    },
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valores',
                    },
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    document.getElementById('btnSubmit').addEventListener('click', () => filterData(myChart, listaSensores));
}

function filterData(myChart, listaSensores) {
    const inicio = new Date(document.getElementById('dataInicio').value);
    const fim = new Date(document.getElementById('dataFim').value);

    if (!inicio || !fim || inicio > fim) {
        alert('Por favor, preencha ambas as datas com valor válido (data inicial, data final).');
        document.getElementById('dataInicio').value = "";
        document.getElementById('dataFim').value = "";
        return;
    }

    const dadosFiltrados = { time: [] };

    for (let i = 0; i < timeData.length; i++) {
        const dataItem = new Date(timeData[i]);
        if (dataItem >= inicio && dataItem <= fim) {
            dadosFiltrados.time.push(timeData[i]);
            listaSensores.forEach(sensor => {
                if (sensorData[sensor][i] !== null) {
                    if (!dadosFiltrados[sensor]) {
                        dadosFiltrados[sensor] = [];
                    }
                    dadosFiltrados[sensor].push(sensorData[sensor][i]);
                } else {
                    if (!dadosFiltrados[sensor]) {
                        dadosFiltrados[sensor] = [];
                    }
                    if (dadosFiltrados[sensor].length > 0) {
                        dadosFiltrados[sensor].push(dadosFiltrados[sensor][dadosFiltrados[sensor].length - 1]);
                    } else {
                        dadosFiltrados[sensor].push(null);
                    }
                }
            });
        }
    }

    if (dadosFiltrados.time.length === 0) {
        alert('Nenhum dado encontrado para o intervalo de datas especificado.');
        return;
    }

    myChart.data.labels = dadosFiltrados.time;
    listaSensores.forEach(sensor => {
        if (dadosFiltrados[sensor]) {
            const dataset = myChart.data.datasets.find(ds => ds.label === sensor);
            if (dataset) {
                dataset.data = dadosFiltrados[sensor];
            }
        }
    });

    myChart.update();
}

async function fetchAllSensors() {
    const sensoresRef = collection(db, "sensores");
    const querySnapshot = await getDocs(sensoresRef);

    const listaSensores = [];
    querySnapshot.forEach((doc) => {
        listaSensores.push(doc.id);
    });

    return listaSensores;
}

function getEstacaoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("estacao");
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    return '#' + Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * 16)]).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    fetchMeasurements();
});
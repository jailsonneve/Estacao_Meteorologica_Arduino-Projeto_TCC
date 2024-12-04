import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, query, where, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
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

export async function fetchDevice(estacao) {
    const dispositivoSnap = await getDoc(doc(db, "dispositivos", estacao));
    if (dispositivoSnap.exists()) {
        return { id: dispositivoSnap.id, ...dispositivoSnap.data() };
    } else {
        throw new Error('Nenhum dispositivo encontrado.');
    }
}

export async function updateDevice(estacao, updateFields) {
    console.log("Dados Salvos com Sucesso!!");
    alert("Dados Salvos com Sucesso!!");
    await updateDoc(doc(db, "dispositivos", estacao), updateFields);
}

export async function deleteDevice(estacao) {
    await deleteDoc(doc(db, "dispositivos", estacao));
    window.location.href="listEstacaoTeste.html"
}

export async function fetchMeasurements(estacao) {
    const medicoesEstacao = query(collection(db, 'medicoes'), where('dispositivo_id', '==', estacao));
    const querySnapshot = await getDocs(medicoesEstacao);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function fetchAllSensors() {
    const sensoresRef = collection(db, "sensores");
    const querySnapshot = await getDocs(sensoresRef);

    const listaSensores = [];
    querySnapshot.forEach((doc) => {
        listaSensores.push(doc.id);
    });

    return listaSensores;
}

export async function fetchSensorsDocuments(deviceData) {
    let listaSensoresExistentes = deviceData.lista_sensores;
    let listaUnidade = [];

    const promises = listaSensoresExistentes.map(async sensor_id => {
        const sensoresDocs = await getDoc(doc(db, "sensores", sensor_id));
        if (sensoresDocs.exists()) {
            let a = { id: sensoresDocs.id, ...sensoresDocs.data() };
            listaUnidade.push(a.unidade_medida);
        }
    });

    await Promise.all(promises); // Aguarda todas as promessas serem resolvidas
    return listaUnidade; 
}


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

        // Verifica se a data já existe no timeData
        if (!timeData.includes(dthr)) {
            timeData.push(dthr);
        }

        // Inicializa o array para o sensor caso não exista
        if (!sensorData[sensor_id]) {
            sensorData[sensor_id] = new Array(timeData.length).fill(null);
        }

        // Atribui o valor à posição correspondente da data
        const index = timeData.indexOf(dthr);
        if (index !== -1) {
            sensorData[sensor_id][index] = valor;
        }
    });

    return { sensorData, timeData };
}

export function getEstacaoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("estacao");
}

export async function baixarCSV() {
    const dataInicio = new Date(document.getElementById('dataInicio').value);
    const dataFim = new Date(document.getElementById('dataFim').value);
    const estacao = getEstacaoId(); // Obtém o ID da estação
    try {
        const medicoes = await fetchMeasurements(estacao); // Busca as medições da estação
        if (medicoes.length === 0) {
            alert("Nenhuma medição encontrada para esta estação.");
            return; // Se não houver medições, exibe alerta e encerra a função
        }

        // Filtra as medições com base no intervalo de datas
        const filteredMedicoes = medicoes.filter(medicao => {
            const dthr = new Date(medicao.dthr);
            return dthr >= new Date(dataInicio) && dthr <= new Date(dataFim);
        });

        if (filteredMedicoes.length === 0) {
            alert("Nenhuma medição encontrada no intervalo de tempo especificado.");
            return; // Se não houver medições no intervalo, exibe alerta
        }

        // Ordena as medições por data e hora
        filteredMedicoes.sort((a, b) => new Date(a.dthr) - new Date(b.dthr));

        // Cabeçalho do CSV
        const header = ['Data', 'Hora', 'Sensor ID', 'Valor'];
        const rows = filteredMedicoes.map(medicao => {
            return [new Date(medicao.dthr).toLocaleString(), medicao.sensor_id, medicao.valor]; // Formata cada medição
        });

        // Cria o conteúdo do CSV
        const csvContent = [
            header.join(","), // Junta o cabeçalho
            ...rows.map(e => e.join(",")) // Junta as linhas de dados
        ].join("\n"); // Junta tudo com quebras de linha

        // Cria um blob com o conteúdo do CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob); // Cria um URL para o blob
        const link = document.createElement("a"); // Cria um link temporário
        link.setAttribute("href", url);
        link.setAttribute("download", `medicoes_estacao_${estacao}.csv`); // Nome do arquivo
        document.body.appendChild(link); // Adiciona o link ao DOM
        link.click(); // Simula um clique no link para iniciar o download
        document.body.removeChild(link); // Remove o link do DOM

        alert("CSV baixado com sucesso!"); // Alerta de sucesso

    } catch (error) {
        console.error("Erro ao baixar o CSV:", error);
        alert("Erro ao baixar o CSV. Tente novamente."); // Tratamento de erro
    }
}
export async function setDates() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    // Data inicial (1º dia do mês)
    const startDate = new Date(year, month, 1);
    const formattedStartDate = startDate.toISOString().slice(0, 16);
    document.getElementById('dataInicio').value = formattedStartDate;

    // Data final (último dia do mês)
    const endDate = new Date(year, month + 1, 0); // 0 retorna o último dia do mês anterior
    const formattedEndDate = endDate.toISOString().slice(0, 16);
    document.getElementById('dataFim').value = formattedEndDate;
}
export async function exibirAlt(id){
    const message = document.getElementById(id);
    message.style.display = 'block'; // Mostra a mensagem
}
export async function ocultarAlt(id){
    const message = document.getElementById(id);
    message.style.display = 'none'; // Oculta a mensagem
}
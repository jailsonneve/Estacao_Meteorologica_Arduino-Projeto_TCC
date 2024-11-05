import { fetchDevice, getEstacaoId,fetchSensorsDocuments, updateDevice, deleteDevice, fetchChartData, baixarCSV, setDates, exibirAlt, ocultarAlt } from '../model/modelPagInfo.js';
import { displayDeviceInfo, showAlert, getFormData, createChart, filterData } from '../view/viewPagInfo.js';

const estacao = getEstacaoId();

document.addEventListener('DOMContentLoaded', async () => {
    const deviceData = await fetchDevice(estacao);
    const sensorData = await fetchSensorsDocuments(deviceData);
    await setDates();
    await displayDeviceInfo(deviceData, sensorData);
    addEventListeners();
    try {
        const { sensorData, timeData } = await fetchChartData(estacao);
        const listaSensores = Object.keys(sensorData);

        // Passando sensorData e timeData como argumentos
        createChart(listaSensores, sensorData, timeData);
        document.getElementById('btnSubmit').addEventListener('click', () => filterData(listaSensores, sensorData, timeData));
        filterData(listaSensores, sensorData, timeData)
    } catch (error) {
        showAlert(error.message);
    }
    $(function () {
        $('[data-bs-toggle="tooltip"]').tooltip();
    });
    $(function () {
        // Inicializa o tooltip
        var tooltip = new bootstrap.Tooltip($('#btnAlterar')[0], {
            title: "Alterar Informações",
            placement: "top"
        });

        // Exibe o tooltip ao passar o mouse
        $('#btnAlterar').on('mouseenter', function () {
            tooltip.show();
        }).on('mouseleave', function () {
            tooltip.hide();
        });
    });
    $(function () {
        // Inicializa o tooltip
        var tooltip = new bootstrap.Tooltip($('#btnExcluir')[0], {
            title: "Excluir Dispositivo",
            placement: "top"
        });

        // Exibe o tooltip ao passar o mouse
        $('#btnExcluir').on('mouseenter', function () {
            tooltip.show();
        }).on('mouseleave', function () {
            tooltip.hide();
        });
    });
});

function addEventListeners() {
    const btnSalvar = document.getElementById('btnSalvar');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', async () => {
            const updateFields = getFormData();
            try {
                await updateDevice(estacao, updateFields);
                
                window.location.reload();
            } catch (error) {
                showAlert("Erro ao salvar alterações: " + error.message);
            }
        });
    } else {
        console.error("Elemento 'btnSalvar' não encontrado.");
    }
    const btnConfirmar = document.getElementById('btnConfirmar');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            try {
                await deleteDevice(estacao); // Chame a função de deletar
                showAlert("Dispositivo apagado com sucesso!");
                window.location.href = "listEstacaoTeste.html";
            } catch (error) {
                showAlert("Erro ao apagar o dispositivo: " + error.message);
            }
        });
    } else {
        console.error("Elemento 'btnConfirmar' não encontrado.");
    }
    const btnBaixar = document.getElementById("downloadBtn");
    if (btnBaixar) {
        btnBaixar.addEventListener('click', async () =>{
            try {
                await baixarCSV()
            } catch (error) {
                showAlert("Erro ao baixar PDF: " + error.message);
            }
        })
    } else {
        console.error("Elemento 'downloadBtn' não encontrado")
    }
}
export function createCardHTML({ nome, descricao, dthrInstalacao, dthrUltConexao, sensoresNomes, status, tipo_dispositivo, dispositivoID }) {
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
export function showAlert(message) {
    alert(message);
}
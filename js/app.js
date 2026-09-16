// js/app.js - Lógica Principal

import { obtenerPacientes, guardarPacientes, obtenerConsultas, guardarConsultas } from './db.js';

let pacientes = obtenerPacientes();
let consultas = obtenerConsultas();
let idConsultaEnEdicion = null; 

document.getElementById('displayDocName').textContent = sessionStorage.getItem('nutri_user');

window.logout = function() {
    sessionStorage.removeItem('nutri_user');
    window.location.href = 'index.html';
};

window.borrarTodosLosDatos = function() {
    if(confirm("⚠️ ¿Estás seguro de borrar todos los pacientes y consultas?")){
        localStorage.removeItem('db_pacientes');
        localStorage.removeItem('db_consultas');
        location.reload();
    }
};

const now = new Date();
document.getElementById('consDate').value = now.toISOString().split('T')[0];
document.getElementById('consTime').value = now.toTimeString().slice(0,5);

function calcularImcEnVivo() {
    const p = parseFloat(document.getElementById('patWeight').value);
    const a = parseFloat(document.getElementById('patHeight').value);
    
    if (p > 0 && a > 0) {
        const imc = (p / (a * a)).toFixed(2);
        document.getElementById('liveImc').textContent = imc;
        
        let diag = document.getElementById('liveDiag');
        if (imc < 18.5) { diag.textContent = "Bajo peso"; diag.style.color = "#0dcaf0"; }
        else if (imc <= 24.9) { diag.textContent = "Normal"; diag.style.color = "#198754"; }
        else if (imc <= 29.9) { diag.textContent = "Sobrepeso"; diag.style.color = "#ffc107"; }
        else { diag.textContent = "Obesidad"; diag.style.color = "#dc3545"; }
    }
}
document.getElementById('patWeight').addEventListener('input', calcularImcEnVivo);
document.getElementById('patHeight').addEventListener('input', calcularImcEnVivo);

document.getElementById('formPaciente').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('patName').value.toUpperCase();
    const edad = document.getElementById('patAge').value;
    const sexo = document.getElementById('patSex').value;
    const peso = parseFloat(document.getElementById('patWeight').value);
    const altura = parseFloat(document.getElementById('patHeight').value);
    
    const imc = (peso / (altura * altura)).toFixed(2);
    let diagnostico = imc < 18.5 ? "Bajo peso" : imc <= 24.9 ? "Normal" : imc <= 29.9 ? "Sobrepeso" : "Obesidad";

    const nuevoPaciente = { id: Date.now(), nombre, edad, sexo, peso, altura, imc, diagnostico };
    pacientes.push(nuevoPaciente);
    guardarPacientes(pacientes);
    
    this.reset();
    document.getElementById('liveImc').textContent = "--";
    document.getElementById('liveDiag').textContent = "";
    actualizarSelectPacientes();
    alert("Paciente guardado correctamente.");
});

function actualizarSelectPacientes() {
    const select = document.getElementById('patSelect');
    select.innerHTML = '<option value="">Seleccione un paciente...</option>';
    pacientes.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nombre} (${p.diagnostico})`;
        select.appendChild(option);
    });
}

document.getElementById('patSelect').addEventListener('change', function(e) {
    const pacienteId = e.target.value;
    const badgesDiv = document.getElementById('patientBadges');
    
    if (!pacienteId) {
        badgesDiv.classList.add('d-none');
        renderizarHistorial(null);
        return;
    }

    const p = pacientes.find(x => x.id === parseInt(pacienteId));
    if (p) {
        badgesDiv.classList.remove('d-none');
        document.getElementById('badgeEdadSexo').textContent = `${p.edad} años • ${p.sexo}`;
        document.getElementById('badgeFisico').textContent = `${p.peso} kg / ${p.altura} m`;
        document.getElementById('badgeImc').textContent = `IMC: ${p.imc}`;
        const bDiag = document.getElementById('badgeDiag');
        bDiag.textContent = p.diagnostico;
        
        bDiag.className = "badge-info text-white"; 
        if(p.diagnostico === 'Normal') bDiag.style.backgroundColor = '#198754';
        else if(p.diagnostico === 'Sobrepeso') bDiag.style.backgroundColor = '#fd7e14';
        else if(p.diagnostico === 'Obesidad') bDiag.style.backgroundColor = '#dc3545';
        else bDiag.style.backgroundColor = '#0dcaf0';
    }
    renderizarHistorial(pacienteId);
});

document.getElementById('formConsulta').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const pacienteId = document.getElementById('patSelect').value;
    const fecha = document.getElementById('consDate').value;
    const hora = document.getElementById('consTime').value;
    const evolucion = document.getElementById('consEvolucion').value;
    const plan = document.getElementById('consPlan').value;
    const btnSubmit = document.getElementById('btnSubmitConsulta');
    
    if (idConsultaEnEdicion) {
        const index = consultas.findIndex(c => c.id_consulta === parseInt(idConsultaEnEdicion));
        if (index !== -1) {
            consultas[index].fecha = fecha;
            consultas[index].hora = hora;
            consultas[index].evolucion = evolucion;
            consultas[index].plan = plan;
        }
        idConsultaEnEdicion = null;
        btnSubmit.textContent = "Guardar Consulta";
        btnSubmit.style.backgroundColor = 'var(--primary-dark)';
    } else {
        const nuevaConsulta = {
            id_consulta: Date.now(),
            id_paciente: parseInt(pacienteId),
            fecha, hora, evolucion, plan
        };
        consultas.push(nuevaConsulta);
    }
    
    guardarConsultas(consultas);
    
    document.getElementById('consEvolucion').value = '';
    document.getElementById('consPlan').value = '';
    renderizarHistorial(pacienteId); 
});

document.getElementById('historialContainer').addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-editar')) {
        const idConsulta = e.target.getAttribute('data-id');
        prepararEdicion(idConsulta);
    }
});

function prepararEdicion(id) {
    const consulta = consultas.find(c => c.id_consulta === parseInt(id));
    if (consulta) {
        document.getElementById('consDate').value = consulta.fecha;
        document.getElementById('consTime').value = consulta.hora;
        document.getElementById('consEvolucion').value = consulta.evolucion;
        document.getElementById('consPlan').value = consulta.plan;
        
        idConsultaEnEdicion = consulta.id_consulta;
        const btnSubmit = document.getElementById('btnSubmitConsulta');
        btnSubmit.textContent = "Guardar Cambios";
        btnSubmit.style.backgroundColor = '#ffc107'; 
        btnSubmit.style.color = '#000';
    }
}

function renderizarHistorial(idPaciente) {
    const container = document.getElementById('historialContainer');
    container.innerHTML = '';
    
    if (!idPaciente) {
        container.innerHTML = '<p class="text-muted">Seleccione un paciente arriba para ver su historial.</p>';
        return;
    }
    
    const historialPaciente = consultas
        .filter(c => c.id_paciente === parseInt(idPaciente))
        .sort((a, b) => b.id_consulta - a.id_consulta); 
        
    if (historialPaciente.length === 0) {
        container.innerHTML = '<div class="alert alert-light border">No hay consultas previas registradas.</div>';
        return;
    }
    
    historialPaciente.forEach(c => {
        container.innerHTML += `
            <div class="card mb-3 shadow-sm border-0" style="background-color: #f8faf9;">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h6 class="text-success m-0">📅 ${c.fecha} - 🕒 ${c.hora}</h6>
                        <button type="button" class="btn btn-sm btn-outline-secondary btn-editar" data-id="${c.id_consulta}">✏️ Editar</button>
                    </div>
                    <p class="mb-1 text-muted" style="font-size:0.85rem; text-transform:uppercase;">Evolución</p>
                    <p class="mb-3">${c.evolucion}</p>
                    <p class="mb-1 text-muted" style="font-size:0.85rem; text-transform:uppercase;">Plan Nutricional</p>
                    <p class="mb-0">${c.plan}</p>
                </div>
            </div>
        `;
    });
}

actualizarSelectPacientes();
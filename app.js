// --- CONFIGURACIÓN INICIAL ---
document.getElementById('displayDocName').textContent = sessionStorage.getItem('nutri_user');

function logout() {
    sessionStorage.removeItem('nutri_user');
    window.location.href = 'index.html';
}

function borrarTodosLosDatos() {
    if(confirm("⚠️ ¿Estás seguro de borrar todos los pacientes y consultas? Esto no se puede deshacer.")){
        localStorage.removeItem('db_pacientes');
        localStorage.removeItem('db_consultas');
        location.reload();
    }
}

// Simulador de BD Relacional
let pacientes = JSON.parse(localStorage.getItem('db_pacientes')) || [];
let consultas = JSON.parse(localStorage.getItem('db_consultas')) || [];

// Autocompletar fecha y hora actual en la consulta
const now = new Date();
document.getElementById('consDate').value = now.toISOString().split('T')[0];
document.getElementById('consTime').value = now.toTimeString().slice(0,5);

// --- CÁLCULO DE IMC EN VIVO (Formulario Izquierdo) ---
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

// --- REGLA 2: GUARDAR PACIENTE ---
document.getElementById('formPaciente').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('patName').value.toUpperCase();
    const edad = document.getElementById('patAge').value;
    const sexo = document.getElementById('patSex').value;
    const peso = parseFloat(document.getElementById('patWeight').value);
    const altura = parseFloat(document.getElementById('patHeight').value);
    
    const imc = (peso / (altura * altura)).toFixed(2);
    let diagnostico = "";
    if (imc < 18.5) diagnostico = "Bajo peso";
    else if (imc <= 24.9) diagnostico = "Normal";
    else if (imc <= 29.9) diagnostico = "Sobrepeso";
    else diagnostico = "Obesidad";

    const nuevoPaciente = { id: Date.now(), nombre, edad, sexo, peso, altura, imc, diagnostico };
    
    pacientes.push(nuevoPaciente);
    localStorage.setItem('db_pacientes', JSON.stringify(pacientes));
    
    this.reset();
    document.getElementById('liveImc').textContent = "--";
    document.getElementById('liveDiag').textContent = "";
    actualizarSelectPacientes();
    
    alert("Paciente guardado correctamente.");
});

// Poblar el menú desplegable de pacientes
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

// --- MOSTRAR ETIQUETAS AL SELECCIONAR PACIENTE (Estilo Imagen) ---
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
        
        // Colores para el diagnóstico
        bDiag.className = "badge-info text-white"; // reset
        if(p.diagnostico === 'Normal') bDiag.style.backgroundColor = '#198754';
        else if(p.diagnostico === 'Sobrepeso') bDiag.style.backgroundColor = '#fd7e14';
        else if(p.diagnostico === 'Obesidad') bDiag.style.backgroundColor = '#dc3545';
        else bDiag.style.backgroundColor = '#0dcaf0';
    }
    
    renderizarHistorial(pacienteId);
});

// --- REGLA 3: GUARDAR CONSULTA Y MOSTRAR HISTORIAL ---
document.getElementById('formConsulta').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const pacienteId = document.getElementById('patSelect').value;
    const fecha = document.getElementById('consDate').value;
    const hora = document.getElementById('consTime').value;
    const evolucion = document.getElementById('consEvolucion').value;
    const plan = document.getElementById('consPlan').value;
    
    const nuevaConsulta = {
        id_consulta: Date.now(),
        id_paciente: parseInt(pacienteId),
        fecha, hora, evolucion, plan
    };
    
    consultas.push(nuevaConsulta);
    localStorage.setItem('db_consultas', JSON.stringify(consultas));
    
    // Limpiar campos de texto pero mantener paciente, fecha y hora
    document.getElementById('consEvolucion').value = '';
    document.getElementById('consPlan').value = '';
    
    renderizarHistorial(pacienteId); 
});

function renderizarHistorial(idPaciente) {
    const container = document.getElementById('historialContainer');
    container.innerHTML = '';
    
    if (!idPaciente) {
        container.innerHTML = '<p class="text-muted">Seleccione un paciente arriba para ver su historial.</p>';
        return;
    }
    
    const historialPaciente = consultas
        .filter(c => c.id_paciente === parseInt(idPaciente))
        .sort((a, b) => b.id_consulta - a.id_consulta); // Lo más nuevo arriba
        
    if (historialPaciente.length === 0) {
        container.innerHTML = '<div class="alert alert-light border">No hay consultas previas registradas.</div>';
        return;
    }
    
    historialPaciente.forEach(c => {
        container.innerHTML += `
            <div class="card mb-3 shadow-sm border-0" style="background-color: #f8faf9;">
                <div class="card-body">
                    <h6 class="text-success border-bottom pb-2 mb-3">📅 ${c.fecha} - 🕒 ${c.hora}</h6>
                    <p class="mb-1 text-muted" style="font-size:0.85rem; text-transform:uppercase;">Evolución</p>
                    <p class="mb-3">${c.evolucion}</p>
                    <p class="mb-1 text-muted" style="font-size:0.85rem; text-transform:uppercase;">Plan Nutricional</p>
                    <p class="mb-0">${c.plan}</p>
                </div>
            </div>
        `;
    });
}

// Inicializar la vista
actualizarSelectPacientes();
// Mostrar el nombre del nutriólogo en la barra de navegación
document.getElementById('displayDocName').textContent = sessionStorage.getItem('nutri_user');

// Función para cerrar sesión
function logout() {
    sessionStorage.removeItem('nutri_user');
    window.location.href = 'index.html';
}

// Simulador de Base de Datos Relacional usando LocalStorage
let pacientes = JSON.parse(localStorage.getItem('db_pacientes')) || [];
let consultas = JSON.parse(localStorage.getItem('db_consultas')) || [];

// --- REGLA 2: Cero duplicaciones y cálculo de IMC ---
document.getElementById('formPaciente').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('patName').value;
    const edad = document.getElementById('patAge').value;
    const peso = parseFloat(document.getElementById('patWeight').value);
    const altura = parseFloat(document.getElementById('patHeight').value);
    
    // Cálculo de IMC
    const imc = (peso / (altura * altura)).toFixed(2);
    let diagnostico = "";
    
    if (imc < 18.5) diagnostico = "Bajo peso";
    else if (imc >= 18.5 && imc <= 24.9) diagnostico = "Peso normal";
    else if (imc >= 25 && imc <= 29.9) diagnostico = "Sobrepeso";
    else diagnostico = "Obesidad";

    // "Insert" a la tabla de pacientes
    const nuevoPaciente = {
        id: Date.now(), // ID único
        nombre, edad, peso, altura, imc, diagnostico
    };
    
    pacientes.push(nuevoPaciente);
    localStorage.setItem('db_pacientes', JSON.stringify(pacientes));
    
    alert(`Paciente Registrado.\nIMC: ${imc} - Diagnóstico: ${diagnostico}`);
    this.reset();
    actualizarSelectPacientes();
});

// Poblar el menú desplegable (relacionando los datos)
function actualizarSelectPacientes() {
    const select = document.getElementById('patSelect');
    select.innerHTML = '<option value="">Seleccione...</option>';
    
    pacientes.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nombre} (IMC: ${p.imc} - ${p.diagnostico})`;
        select.appendChild(option);
    });
}

// --- REGLA 3: Historial Vivo y Cronológico ---
document.getElementById('formConsulta').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const pacienteId = document.getElementById('patSelect').value;
    const evolucion = document.getElementById('consEvolucion').value;
    const plan = document.getElementById('consPlan').value;
    
    const ahora = new Date();
    
    // "Insert" a la tabla relacional de consultas
    const nuevaConsulta = {
        id_consulta: Date.now(),
        id_paciente: parseInt(pacienteId),
        fecha: ahora.toLocaleDateString(),
        hora: ahora.toLocaleTimeString(),
        evolucion,
        plan
    };
    
    consultas.push(nuevaConsulta);
    localStorage.setItem('db_consultas', JSON.stringify(consultas));
    
    this.reset();
    document.getElementById('patSelect').value = pacienteId; // Mantener paciente seleccionado
    renderizarHistorial(pacienteId); // Actualización en tiempo real (sin F5)
});

// Escuchar cuando el nutriólogo cambia de paciente en el menú
document.getElementById('patSelect').addEventListener('change', function(e) {
    renderizarHistorial(e.target.value);
});

// Renderizar el historial asegurando que lo más nuevo esté arriba
function renderizarHistorial(idPaciente) {
    const container = document.getElementById('historialContainer');
    container.innerHTML = '';
    
    if (!idPaciente) {
        container.innerHTML = '<p class="text-muted">Seleccione un paciente arriba para ver su historial.</p>';
        return;
    }
    
    // Filtrar consultas del paciente y ordenarlas descendente (las más nuevas arriba)
    const historialPaciente = consultas
        .filter(c => c.id_paciente === parseInt(idPaciente))
        .sort((a, b) => b.id_consulta - a.id_consulta);
        
    if (historialPaciente.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No hay consultas previas para este paciente.</div>';
        return;
    }
    
    historialPaciente.forEach(c => {
        container.innerHTML += `
            <div class="card mb-3 border-success shadow-sm">
                <div class="card-header bg-success bg-opacity-25 d-flex justify-content-between">
                    <strong>Consulta Registrada</strong>
                    <span>📅 ${c.fecha} - 🕒 ${c.hora}</span>
                </div>
                <div class="card-body">
                    <p><strong>Evolución:</strong> ${c.evolucion}</p>
                    <p class="mb-0"><strong>Plan Nutricional:</strong> ${c.plan}</p>
                </div>
            </div>
        `;
    });
}

// Inicializar la vista al cargar la página
actualizarSelectPacientes();
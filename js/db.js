// js/db.js - Módulo de conexión de datos

export function obtenerPacientes() {
    return JSON.parse(localStorage.getItem('db_pacientes')) || [];
}

export function guardarPacientes(pacientes) {
    localStorage.setItem('db_pacientes', JSON.stringify(pacientes));
}

export function obtenerConsultas() {
    return JSON.parse(localStorage.getItem('db_consultas')) || [];
}

export function guardarConsultas(consultas) {
    localStorage.setItem('db_consultas', JSON.stringify(consultas));
}